#!/bin/bash

# IMPORTING THE ENVIRONMENT VARIABLES
source ./.env
export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/configs


# FUNCTION TO PRINT HELP
function printHelp(){

    echo
    echo "Usage: "
    echo "  startNet.sh <mode>"
    echo "      <mode> - one of the 'up', 'down', 'restart', 'generate', 'clear'"
    echo "        - 'up' - Bring Up The Network"
    echo "        - 'down' - Tear Down The Services"
    echo "        - 'clear' - Clear the Crypto Material"
    echo "        - 'restart' - Restart The Network"
    echo "        - 'generate' - Generate Crypto-Config & Channel-Artifacts"
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
    ################ !!!!!!!!!! CCP GENERATION LEFT

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
    configtxgen -profile SampleMultiNodeEtcdRaft -channelID byfn-sys-channel \
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
    set +x
}

# FUNCTION TO START THE CONTAINERS
function networkUp(){

    echo
    echo "#######################################"
    echo "####### Starting The Network  #########"
    echo "#######################################"

    docker-compose \
    -f configs/docker-compose-cli.yaml \
    -f configs/docker-compose-couch.yaml \
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

    echo
    echo "#######################################"
    echo "####### Stopping The Network  #########"
    echo "#######################################"

    docker-compose \
    -f configs/docker-compose-cli.yaml \
    -f configs/docker-compose-couch.yaml \
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

# GETTING THE ARGUMENT PASSED WITH THE COMMAND
MODE=$1
shift

# WORKING ACCORDING TO THE ARGUMENT
if [ "${MODE}" == "up" ]; then
    clearThings
    generateCerts
    generateChannelArtifacts
    networkUp
elif [ "${MODE}" == "down" ]; then
    networkDown
    clearThings 1
elif [ "${MODE}" == "restart" ]; then
    networkDown
    clearThings
    generateCerts
    generateChannelArtifacts
    networkUp
elif [ "${MODE}" == "generate" ]; then
    clearThings
    generateCerts
    generateChannelArtifacts
elif [ "${MODE}" == "clear" ]; then
    clearThings
else
    printHelp
    exit 1
fi
