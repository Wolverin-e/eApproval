# eProcurement
B.Tech Project On eProcurement using Blockchain - Hyperledger Fabric.

## Installation

- Clone the move in the repo

    ```
     git clone <link> | cd <project_directory_name>  # eProcurement
    ```
- Download all the [prerequisite](https://hyperledger-fabric.readthedocs.io/en/release-2.0/prereqs.html) 
  NOTE: install node v10 insted of v8, when given option

- If you have been playing with Docker, kill any stale or active containers.

  ```
  docker rm -f $(docker ps -aq)
  docker rmi -f $(docker images | grep fabcar | awk '{print $3}')
  ```
 
 - We need some binary files of hyperleder to start our network. Follow this [guide](https://hyperledger-fabric.readthedocs.io/en/release-2.0/install.html) to install them.

- start the network
  ```
  ./startNet.sh up
  ```
  NOTE: If the network is still down, try moving `fabric-samples/bin` folder to `cwd`
  
 - deploy the chaincode to the network
  ```
  ./deploy.sh -a
  ```
  
  Now, lets install the apis
  
  - move to `/api` folder
  ```
  cd api
  ```
  - install node modules
  ```
  npm install
  ```
  NOTE: All modules wont be installed without node v10
  
  - start the api server
  ```
  npm start
  ```
