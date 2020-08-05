#!/bin/bash

# IMPORTING THE ENVIRONMENT VARIABLES
source ./.env
export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/configs


# FUNCTION TO PRINT HELP
function printHelp(){

    echo
    echo "Usage: "
    echo "  startNet.sh <mode> [-h] [-n]"
    echo "      <mode> - one of the 'up', 'down', 'restart', 'generate', 'clear'"
    echo "        - 'up' - Bring Up The Network"
    echo "        - 'down' - Tear Down The Services"
    echo "        - 'clear' - Clear the Crypto Material"
    echo "        - 'restart' - Restart The Network"
    echo "        - 'generate' - Generate Crypto-Config & Channel-Artifacts"
    echo "      -n - Don't start CA Nodes"
    echo "      -h - Get Help"
    echo
}

# FUNCTION TO CHECK FOR ERRORS
function checkResult(){

    res=$?
    set +x
    if [ $res -ne 0 ]
    then
        echo ERROR
        exit 1
    else
        echo "----- SUCCESS ----- "
        echo
    fi
}

# FUNCTION TO GENERATE PKI CERTIFICATES
function generateCerts(){

    which cryptogen > /dev/null
    if [ $? -ne 0 ]; then
        echo "Please check bin folder for cryptogen tool."
        exit 1
    fi

    echo
    echo "##########################################################"
    echo "##### Generate certificates using cryptogen tool #########"
    echo "##########################################################"

    if [ -d "crypto-config" ]; then
        rm -Rf crypto-config
    fi

    pushd ./configs > /dev/null

    set -x
    cryptogen generate --config=./crypto-config.yaml
    checkResult

    popd > /dev/null

    echo
}

# FUNCTION TO GENERATE CHANNEL ARTIFACTS (GENISIS BLOCK, CHANNEL Tx, ANCHOR PEERs Txs)
function generateChannelArtifacts(){

    which configtxgen > /dev/null
    if [ "$?" -ne 0 ]; then
        echo "Please check bin folder for configtxgen tool."
        exit 1
    fi

    pushd ./configs > /dev/null

    echo "##########################################################"
    echo "#########  Generating Orderer Genesis block ##############"
    echo "##########################################################"
    set -x
    configtxgen -profile SampleMultiNodeEtcdRaft -channelID $SYS_CHANNEL \
        -outputBlock ./channel-artifacts/genesis.block
    checkResult


    echo
    echo "#################################################################"
    echo "### Generating channel configuration transaction 'channel.tx' ###"
    echo "#################################################################"
    set -x
    configtxgen -profile TwoOrgsChannel -outputCreateChannelTx \
        ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
    checkResult


    echo
    echo "#################################################################"
    echo "#######    Generating anchor peer update for Org1MSP   ##########"
    echo "#################################################################"
    set -x
    configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate \
        ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME \
        -asOrg Org1MSP
    checkResult


    echo
    echo "#################################################################"
    echo "#######    Generating anchor peer update for Org2MSP   ##########"
    echo "#################################################################"
    set -x
    configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate \
        ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME \
        -asOrg Org2MSP
    checkResult


    popd > /dev/null
    echo
}

# FUNCTION TO GENERATE NETWORK CCP
function generateCCP(){

    echo
    echo "##########################################################"
    echo "##### Generate certificates using cryptogen tool #########"
    echo "##########################################################"
    set -x
    ./genccp.sh
    checkResult

    echo
}

# FUNCTION TO CLEAR PREVIOUSLY GENERATED CERTS AND ARTIFACTS
function clearThings(){

    # GETTING THE ARGUMENTS PASSED TO THE FUNCTION.
    CLEAR_SCREEN=$1

    # CLEARING THE SCEEN FIRST IF NO ARGUMENTS HAVE BEEN PASSED.
    if [ "${CLEAR_SCREEN}" == "" ]; then
        clear
    fi

    echo
    echo "#################################################################"
    echo "####### Clearing Generated Certificates And Artificats  #########"
    echo "#################################################################"
    set -x
    ./clearFolders.sh
    checkResult
}

# FUNCTION TO START THE CONTAINERS
function networkUp(){

    if [ "${NO_CA}" != "true" ]; then
        DOCKER_COMPOSE_FILES="${DOCKER_COMPOSE_FILES} -f ${DOCKER_COMPOSE_CA}"
        export EAPPROVAL_CA1_PRIVATE_KEY=$(cd configs/crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
        # echo ${EAPPROVAL_CA1_PRIVATE_KEY}
        export EAPPROVAL_CA2_PRIVATE_KEY=$(cd configs/crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)
        # echo ${EAPPROVAL_CA2_PRIVATE_KEY}
    fi

    echo
    echo "#######################################"
    echo "####### Starting The Network  #########"
    echo "#######################################"

    docker-compose \
    ${DOCKER_COMPOSE_FILES} \
    up -d

    checkResult

    echo
    echo "#######################################"
    echo "############  Containers  #############"
    echo "#######################################"
    docker ps --all
    echo "#######################################"
    echo
}

# FUNCTION TO STOP AND REMOVE THE CONTAINERS
function networkDown(){

    export EAPPROVAL_CA1_PRIVATE_KEY=$(cd configs/crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
    export EAPPROVAL_CA2_PRIVATE_KEY=$(cd configs/crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)
    DOCKER_COMPOSE_FILES="${DOCKER_COMPOSE_FILES} -f ${DOCKER_COMPOSE_CA}"
    
    echo
    echo "#######################################"
    echo "####### Stopping The Network  #########"
    echo "#######################################"

    docker-compose \
    ${DOCKER_COMPOSE_FILES} \
    down --volumes --remove-orphans

    echo
    echo
    echo "#######################################"
    echo "############  Containers  #############"
    echo "#######################################"
    docker ps --all
    echo "#######################################"
    echo


    # $(docker ps --all | awk '{ORS=" "} ($2 ~ /dev-peer.*/) {print $1}')
    # $(docker images | awk '{ORS=" "} ($1 ~ /dev-peer.*/) {print $3}')

    echo
    echo "##########################################################"
    echo "############  REMOVING CHAINCODE CONTAINERS  #############"
    echo "##########################################################"
    CONTAINER_IDS=$(docker ps --all | awk '{ORS=" "} ($2 ~ /dev-peer.*/) {print $1}')
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
        echo "---- No containers available for deletion ----"
    else
        set -x
        docker rm -f $CONTAINER_IDS
        checkResult
    fi
    echo 


    echo
    echo "##########################################################"
    echo "##############  REMOVING CHAINCODE IMAGES  ###############"
    echo "##########################################################"
    DOCKER_IMAGE_IDS=$(docker images | awk '{ORS=" "} ($1 ~ /dev-peer.*/) {print $3}')
    if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
        echo "---- No images available for deletion ----"
    else
        set -x
        docker rmi -f $DOCKER_IMAGE_IDS
        checkResult
    fi
    echo
}


###################################################

# DECLARING NECESSARY VARS
DOCKER_COMPOSE_CLI=configs/docker-compose-cli.yaml
DOCKER_COMPOSE_DB=configs/docker-compose-couch.yaml
DOCKER_COMPOSE_CA=configs/docker-compose-ca.yaml
DOCKER_COMPOSE_FILES="-f ${DOCKER_COMPOSE_CLI} -f ${DOCKER_COMPOSE_DB}"


# GETTING THE ARGUMENT PASSED WITH THE COMMAND
MODE=$1
shift

# GETTING OPTS
while getopts "nh" opt; do
  case "$opt" in
  h | \?)
    printHelp
    exit 0
    ;;
  n)
    NO_CA=true
    ;;
  esac
done

# WORKING ACCORDING TO THE ARGUMENT
if [ "${MODE}" == "up" ]; then
    clearThings
    generateCerts
    generateChannelArtifacts
    generateCCP
    networkUp
elif [ "${MODE}" == "down" ]; then
    networkDown
    clearThings 1
elif [ "${MODE}" == "restart" ]; then
    networkDown
    clearThings
    generateCerts
    generateChannelArtifacts
    generateCCP
    networkUp
elif [ "${MODE}" == "generate" ]; then
    clearThings
    generateCerts
    generateChannelArtifacts
    generateCCP
elif [ "${MODE}" == "clear" ]; then
    clearThings
else
    printHelp
    exit 1
fi
