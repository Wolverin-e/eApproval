#!/bin/bash

source ./.env
export PATH=${PWD}/bin:${PWD}:$PATH
export CC_RUNTIME_LANGUAGE=golang
export CC_SRC_PATH=/root/chaincode/fabcar/go

# FUNCTION TO PRINT HELP
function printhelp(){
  
  echo 
  echo "Usage:"
  echo "  deploy.sh [-a] [-h] [-n] [-i] [-c]"
  echo "  -a - DO INITIAL SETUP AND INSTALL CHAINCODE"
  echo "  -n - NO CHAINCODE INSTALLATION"
  echo "  -c - CHAINCODE ONLY"
  echo "  -i - IGNORE ERRORS"
  echo "  -h - HELP"
  echo
}

# FUNCTION TO CHECK FOR ERRORS
function checkResult(){

  res=$?
  if [ $res -ne 0 ]
  then
    echo "!!!!! ERROR !!!!!"
    if [ "${IGNORE_ERRORS}" != "true" ]; then
      exit 1
    fi
  else
    echo "----- SUCCESS -----"
    echo
  fi
}


while getopts "h?ncai" opt; do
  case "$opt" in
  h | \?)
    printhelp
    ;;
  n)
    CHAIN_CODE_ONLY=false
    NO_CHAINCODE=true
    ;;
  c)
    CHAIN_CODE_ONLY=true
    NO_CHAINCODE=false
    ;;
  a)
    CHAIN_CODE_ONLY=false
    NO_CHAINCODE=false
    ;;
  i)
    IGNORE_ERRORS=true
  esac
done

# Setting The Paths..
CONFIG_ROOT=/root/crypto
#----------------------------------#
ORG1_MSPCONFIGPATH=${CONFIG_ROOT}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
ORG2_MSPCONFIGPATH=${CONFIG_ROOT}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
ORG1_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
ORG2_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
#----------------------------------#
DEFAULT_ORDERER=orderer.example.com:7050
ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
#----------------------------------#


PEER0_ORG1="docker exec
-e CORE_PEER_LOCALMSPID=Org1MSP
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051
-e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH}
-e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_TLS_ROOTCERT_FILE}
cli
peer
--tls=true
--cafile=${ORDERER_TLS_ROOTCERT_FILE}
--orderer=${DEFAULT_ORDERER}
"

PEER0_ORG2="docker exec
-e CORE_PEER_LOCALMSPID=Org2MSP
-e CORE_PEER_ADDRESS=peer0.org2.example.com:9051
-e CORE_PEER_MSPCONFIGPATH=${ORG2_MSPCONFIGPATH}
-e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_TLS_ROOTCERT_FILE}
cli
peer
--tls=true
--cafile=${ORDERER_TLS_ROOTCERT_FILE}
--orderer=${DEFAULT_ORDERER}
"

if [ "${CHAIN_CODE_ONLY}" != "true" ]; then

  echo
  echo "################################"
  echo "####### CREATING CHANNEL #######"
  echo "################################"
  ${PEER0_ORG1} channel create -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx
  checkResult
  echo


  echo
  echo "################################"
  echo "####### JOINING CHANNEL ########"
  echo "################################"
  ${PEER0_ORG1} channel join -b $CHANNEL_NAME.block
  checkResult
  sleep 3

  ${PEER0_ORG2} channel join -b $CHANNEL_NAME.block
  checkResult
  sleep 3
  echo


  echo
  echo "######################################"
  echo "####### UPDATING ANCHOR PEERS ########"
  echo "######################################"
  ${PEER0_ORG1} channel update -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx
  checkResult

  ${PEER0_ORG2} channel update -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx
  checkResult
  echo

fi

# INSTALLING CHAINCODE
if [ "${NO_CHAINCODE}" != "true" ]; then

  echo "Vendoring Go dependencies ..."
  pushd ./configs/chaincode/fabcar/go
  GO111MODULE=on go mod vendor
  popd
  echo


  echo
  echo "##############################################################"
  echo "####### PACKAGING CHAINCODE ON peer0.org1.example.com ########"
  echo "##############################################################"
  ${PEER0_ORG1} lifecycle chaincode package \
    fabcar.tar.gz \
    --path "${CC_SRC_PATH}" \
    --lang "${CC_RUNTIME_LANGUAGE}" \
    --label fabcarv1
  checkResult
  echo


  echo
  echo "##############################################################"
  echo "####### INSTALLING CHAINCODE ON peer0.org1.example.com #######"
  echo "##############################################################"
  ${PEER0_ORG1} lifecycle chaincode install \
    fabcar.tar.gz
  checkResult
  echo

  REGEX='Package ID: (.*), Label: fabcarv1'
  if [[ `${PEER0_ORG1} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    PACKAGE_ID_ORG1=${BASH_REMATCH[1]}
    echo $PACKAGE_ID_ORG1
  else
    echo Could not find package ID for fabcarv1 chaincode on peer0.org1.example.com
    exit 1
  fi


  echo
  echo "########################################################"
  echo "####### APPROVING CHAINCODE DEFINATION FOR ORG1 ########"
  echo "########################################################"
  ${PEER0_ORG1} lifecycle chaincode approveformyorg \
    --package-id ${PACKAGE_ID_ORG1} \
    --channelID mychannel \
    --name fabcar \
    --version 1.0 \
    --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
    --sequence 1 \
    --waitForEvent
  checkResult
  echo


  echo
  echo "##############################################################"
  echo "####### PACKAGING CHAINCODE ON peer0.org2.example.com ########"
  echo "##############################################################"
  ${PEER0_ORG2} lifecycle chaincode package \
    fabcar.tar.gz \
    --path "$CC_SRC_PATH" \
    --lang "$CC_RUNTIME_LANGUAGE" \
    --label fabcarv1
  checkResult
  echo


  echo
  echo "##############################################################"
  echo "####### INSTALLING CHAINCODE ON peer0.org2.example.com #######"
  echo "##############################################################"
  ${PEER0_ORG2} lifecycle chaincode install fabcar.tar.gz
  checkResult
  echo

  REGEX='Package ID: (.*), Label: fabcarv1'
  if [[ `${PEER0_ORG2} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    PACKAGE_ID_ORG2=${BASH_REMATCH[1]}
    echo $PACKAGE_ID_ORG2
  else
    echo Could not find package ID for fabcarv1 chaincode on peer0.org2.example.com
    exit 1
  fi


  echo
  echo "########################################################"
  echo "####### APPROVING CHAINCODE DEFINATION FOR ORG2 ########"
  echo "########################################################"
  ${PEER0_ORG2} lifecycle chaincode approveformyorg \
    --package-id ${PACKAGE_ID_ORG2} \
    --channelID mychannel \
    --name fabcar \
    --version 1.0 \
    --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
    --sequence 1 \
    --waitForEvent
  checkResult
  echo


  echo
  echo "################################################"
  echo "####### COMMITING CHAINCODE DEFINATION  ########"
  echo "################################################"
  ${PEER0_ORG1} lifecycle chaincode commit \
    --channelID mychannel \
    --name fabcar \
    --version 1.0 \
    --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
    --sequence 1 \
    --waitForEvent \
    --peerAddresses peer0.org1.example.com:7051 \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
    --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
  checkResult
  echo


  echo
  echo "######################################################"
  echo "####### INVOKING INIT IN CHAINCODE DEFINATION ########"
  echo "######################################################"
  ${PEER0_ORG1} chaincode invoke \
    -C mychannel \
    -n fabcar \
    -c '{"function":"initLedger","Args":[]}' \
    --waitForEvent \
    --waitForEventTimeout 300s \
    --peerAddresses peer0.org1.example.com:7051 \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
    --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
  checkResult
  echo


  echo
  echo "###################################"
  echo "####### QUERYING CHAINCODE ########"
  echo "###################################"
  ${PEER0_ORG1} chaincode query \
    -C mychannel \
    -n fabcar \
    -c '{"function":"queryAllCars","Args":[]}' \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
  checkResult
  echo

fi
