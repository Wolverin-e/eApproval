#!/bin/bash

source ./.env
export PATH=${PWD}/bin:${PWD}:$PATH

echo "Vendoring Go dependencies ..."
CC_RUNTIME_LANGUAGE=golang
CC_SRC_PATH=github.com/hyperledger/fabric-samples/chaincode/fabcar/go

pushd ./configs/chaincode/fabcar/go
GO111MODULE=on go mod vendor
popd

echo

# Setting The Paths..
CONFIG_ROOT=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto
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


echo "Creating channel..."
${PEER0_ORG1} channel create -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx

echo "Having all peers join the channel..."
${PEER0_ORG1} channel join -b $CHANNEL_NAME.block
sleep 3
${PEER0_ORG2} channel join -b $CHANNEL_NAME.block
sleep 3

echo "Updating Anchor Peers..."
${PEER0_ORG1} channel update -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx
${PEER0_ORG2} channel update -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx

echo "Packaging smart contract on peer0.org1.example.com"
${PEER0_ORG1} lifecycle chaincode package \
  fabcar.tar.gz \
  --path "${CC_SRC_PATH}" \
  --lang "${CC_RUNTIME_LANGUAGE}" \
  --label fabcarv1

echo "Installing smart contract on peer0.org1.example.com"
${PEER0_ORG1} lifecycle chaincode install \
  fabcar.tar.gz

echo "Determining package ID for smart contract on peer0.org1.example.com"
REGEX='Package ID: (.*), Label: fabcarv1'
if [[ `${PEER0_ORG1} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
  PACKAGE_ID_ORG1=${BASH_REMATCH[1]}
else
  echo Could not find package ID for fabcarv1 chaincode on peer0.org1.example.com
  exit 1
fi

echo "Approving smart contract for org1"
${PEER0_ORG1} lifecycle chaincode approveformyorg \
  --package-id ${PACKAGE_ID_ORG1} \
  --channelID mychannel \
  --name fabcar \
  --version 1.0 \
  --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
  --sequence 1 \
  --waitForEvent

echo "Packaging smart contract on peer0.org2.example.com"
${PEER0_ORG2} lifecycle chaincode package \
  fabcar.tar.gz \
  --path "$CC_SRC_PATH" \
  --lang "$CC_RUNTIME_LANGUAGE" \
  --label fabcarv1

echo "Installing smart contract on peer0.org2.example.com"
${PEER0_ORG2} lifecycle chaincode install fabcar.tar.gz

echo "Determining package ID for smart contract on peer0.org2.example.com"
REGEX='Package ID: (.*), Label: fabcarv1'
if [[ `${PEER0_ORG2} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
  PACKAGE_ID_ORG2=${BASH_REMATCH[1]}
else
  echo Could not find package ID for fabcarv1 chaincode on peer0.org2.example.com
  exit 1
fi

echo "Approving smart contract for org2"
${PEER0_ORG2} lifecycle chaincode approveformyorg \
  --package-id ${PACKAGE_ID_ORG2} \
  --channelID mychannel \
  --name fabcar \
  --version 1.0 \
  --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
  --sequence 1 \
  --waitForEvent

echo "Committing smart contract"
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

echo "Submitting initLedger transaction to smart contract on mychannel"
# echo "The transaction is sent to all of the peers so that chaincode is built before receiving the following requests"
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

${PEER0_ORG1} chaincode query \
  -C mychannel \
  -n fabcar \
  -c '{"function":"queryAllCars","Args":[]}' \
  --peerAddresses peer0.org1.example.com:7051 \
  --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}