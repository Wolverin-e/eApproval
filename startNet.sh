
#!/bin/bash

source ./.env

export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/configs


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
    set +x

    popd > /dev/null
    ################ !!!!!!!!!! CCP GENERATION LEFT

    echo
}

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
    # Note: For some unknown reason (at least for now) the block file can't be
    # named orderer.genesis.block or the orderer will fail to launch!
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

function clearThings(){

    # CLEARING THE SCEEN FIRST
    clear

    echo
    echo "#################################################################"
    echo "####### Clearing Generated Certificates And Artificats  #########"
    echo "#################################################################"
    
    set -x
    ./clearFolders.sh
    checkResult
    set +x
}

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

function networkUp(){

    echo
    echo "#######################################"
    echo "####### Starting The Network  #########"
    echo "#######################################"

    docker-compose \
    -f configs/docker-compose-cli.yaml \
    -f configs/docker-compose-couch.yaml \
    up -d

    echo "#######################################"
    docker ps --all
    
    echo
}

function networkDown(){

    echo
    echo "#######################################"
    echo "####### Stopping The Network  #########"
    echo "#######################################"

    docker-compose \
    -f configs/docker-compose-cli.yaml \
    -f configs/docker-compose-couch.yaml \
    down --volumes --remove-orphans

    echo "#######################################"
    docker ps --all
    
    echo
}


###################################################

export CHANNEL_NAME=mychannel

# clearThings
# generateCerts
# generateChannelArtifacts

# networkUp

networkDown
