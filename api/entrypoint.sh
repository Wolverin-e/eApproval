#!/bin/bash

if [ "${MODE}" == "production" ]; then
    node_modules/.bin/env-cmd -r .env.rc.json -e api-dev,test node enrollAdmin.js
    node_modules/.bin/env-cmd -r .env.rc.json -e api-dev,test node registerUser.js
    npm start
elif [ "${MODE}" == "simulation" ]; then
    npm run simulation
else
    echo "MODE UNDEFINED!! ${MODE}"
    exit 1
fi
