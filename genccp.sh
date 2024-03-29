#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ./configs/ccp/ccp-template.json 
}

ORG=1
P0PORT=7051
CAPORT=7054
PEERPEM=configs/crypto-config/peerOrganizations/org1.eapproval.com/tlsca/tlsca.org1.eapproval.com-cert.pem
CAPEM=configs/crypto-config/peerOrganizations/org1.eapproval.com/ca/ca.org1.eapproval.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > configs/ccp/connection-org1.json

ORG=2
P0PORT=9051
CAPORT=9054
PEERPEM=configs/crypto-config/peerOrganizations/org2.eapproval.com/tlsca/tlsca.org2.eapproval.com-cert.pem
CAPEM=configs/crypto-config/peerOrganizations/org2.eapproval.com/ca/ca.org2.eapproval.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > configs/ccp/connection-org2.json
