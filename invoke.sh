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

echo
echo "######################################################"
echo "####### INVOKING INIT IN CHAINCODE DEFINITION ########"
echo "######################################################"
# -c '{"function": "getTotalRequests", "Args": []}' \
# -c '{"function": "createRequest", "Args": ["mitul", "abc", "abc", "gc cd ab cde"]}' \
${PEER0_ORG1} chaincode invoke \
-C mychannel \
-n ${CC_NAME} \
-c '{"function": "declineRequest", "Args": ["PENDINGRequest1", "gc", "Good initiative"]}' \
--waitForEvent \
--waitForEventTimeout 300s \
--peerAddresses peer0.org1.example.com:7051 \
--peerAddresses peer0.org2.example.com:9051 \
--tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
--tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
checkResult
echo