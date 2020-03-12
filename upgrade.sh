source ./.env
export PATH=${PWD}/bin:${PWD}:$PATH

# FUNCTION TO CHECK RESULTS
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

# FUNCTION TO PRINT HELP
function printhelp(){

  echo
  echo "Usage:"
  echo "  upgrade.sh [-n <name>] [-l <lable>] [-v <version>] [-s <sequence>] [-p <path>] [-h]"
  echo "  -v <version> - Version of The chaincode"
  echo "  -s <sequence> - sequence of chaincodes"
  echo "  -p <path> - Path inside the container"
  echo "  -n <name> - Name of the Chaincode"
  echo "  -l <lable> - Lable to be given"
  echo "  -h - Get Help"
  echo
  echo "  Without any options it will run with defaults."
  echo

  exit 0
}

while getopts "h?n:l:v:s:p:" opt; do
  case "$opt" in
  h | \?)
    printhelp
    ;;
  n)
    CC_NAME=$OPTARG
    ;;
  l)
    CC_LABLE=$OPTARG
    ;;
  v)
    CC_VERSION=$OPTARG
    ;;
  s)
    CC_SEQUENCE=$OPTARG
    ;;
  p)
    CC_SRC_PATH=$OPTARG
  esac
done

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

# echo "Vendoring Go dependencies ..."
# pushd ./configs/chaincode/fabcar2/go
# GO111MODULE=on go mod vendor
# popd
# echo

echo
echo "##############################################################"
echo "####### PACKAGING CHAINCODE ON peer0.org1.example.com ########"
echo "##############################################################"
${PEER0_ORG1} lifecycle chaincode package \
${CC_NAME}.tar.gz \
--path "${CC_SRC_PATH}" \
--lang "${CC_RUNTIME_LANGUAGE}" \
--label ${CC_LABLE}
checkResult
echo


echo
echo "##############################################################"
echo "####### INSTALLING CHAINCODE ON peer0.org1.example.com #######"
echo "##############################################################"
${PEER0_ORG1} lifecycle chaincode install \
${CC_NAME}.tar.gz
checkResult
echo

REGEX="Package ID: ${CC_LABLE}:(.*), Label: ${CC_LABLE}"
if [[ `${PEER0_ORG1} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    PACKAGE_ID_ORG1=${CC_LABLE}:${BASH_REMATCH[1]}
    echo $PACKAGE_ID_ORG1
else
    echo Could not find package ID for ${CC_LABLE} chaincode on peer0.org1.example.com
    exit 1
fi


echo
echo "########################################################"
echo "####### APPROVING CHAINCODE DEFINITION FOR ORG1 ########"
echo "########################################################"
${PEER0_ORG1} lifecycle chaincode approveformyorg \
--package-id ${PACKAGE_ID_ORG1} \
--channelID mychannel \
--name ${CC_NAME} \
--version ${CC_VERSION} \
--signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
--sequence ${CC_SEQUENCE} \
--waitForEvent
checkResult
echo


echo
echo "##############################################################"
echo "####### PACKAGING CHAINCODE ON peer0.org2.example.com ########"
echo "##############################################################"
${PEER0_ORG2} lifecycle chaincode package \
${CC_NAME}.tar.gz \
--path "$CC_SRC_PATH" \
--lang "$CC_RUNTIME_LANGUAGE" \
--label ${CC_LABLE}
checkResult
echo


echo
echo "##############################################################"
echo "####### INSTALLING CHAINCODE ON peer0.org2.example.com #######"
echo "##############################################################"
${PEER0_ORG2} lifecycle chaincode install ${CC_NAME}.tar.gz
checkResult
echo

REGEX="Package ID: ${CC_LABLE}:(.*), Label: ${CC_LABLE}"
if [[ `${PEER0_ORG2} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    PACKAGE_ID_ORG2=${CC_LABLE}:${BASH_REMATCH[1]}
    echo $PACKAGE_ID_ORG2
else
    echo Could not find package ID for ${CC_LABLE} chaincode on peer0.org2.example.com
    exit 1
fi


echo
echo "########################################################"
echo "####### APPROVING CHAINCODE DEFINITION FOR ORG2 ########"
echo "########################################################"
${PEER0_ORG2} lifecycle chaincode approveformyorg \
--package-id ${PACKAGE_ID_ORG2} \
--channelID mychannel \
--name ${CC_NAME} \
--version ${CC_VERSION} \
--signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
--sequence ${CC_SEQUENCE} \
--waitForEvent
checkResult
echo
sleep 2

echo
echo "################################################"
echo "####### COMMITING CHAINCODE DEFINITION  ########"
echo "################################################"
${PEER0_ORG1} lifecycle chaincode commit \
--channelID mychannel \
--name ${CC_NAME} \
--version ${CC_VERSION} \
--signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
--sequence ${CC_SEQUENCE} \
--waitForEvent \
--peerAddresses peer0.org1.example.com:7051 \
--peerAddresses peer0.org2.example.com:9051 \
--tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
--tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
checkResult
echo


echo
echo "######################################################"
echo "####### INVOKING INIT IN CHAINCODE DEFINITION ########"
echo "######################################################"
${PEER0_ORG1} chaincode invoke \
-C mychannel \
-n ${CC_NAME} \
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
-n ${CC_NAME} \
-c '{"function":"getTotalRequests","Args":[]}' \
--peerAddresses peer0.org1.example.com:7051 \
--tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
checkResult
echo

# ${PEER0_ORG1} lifecycle chaincode queryinstalled
# ${PEER0_ORG2} lifecycle chaincode queryinstalled
