const app = require('express')();
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const getCCP = require('./ccp');

/////////////////////////// TEST FUNCTIONALITIES

// TEST for environment variables
if(!process.env.test){
    throw new Error("ENVs NOT FLUSHED");
}

// TEST to check if API is Working or not
app.get("/test", (req, res) => {
    res.send("Working");
})


////////////////////////// CONFS

const contract_query = async (...query) => {
    const ccp = getCCP('org1');
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: 'user1', 
        discovery: {
            enabled: true, 
            asLocalhost: true
        }
    });

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('eprocurement');

    const result  = await contract.evaluateTransaction(...query);

    return result;
}

const contract_invoke = async (...query) => {
    const ccp = getCCP('org1');
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: 'user1', 
        discovery: {
            enabled: true, 
            asLocalhost: true
        }
    });

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('eprocurement');

    const result  = await contract.submitTransaction(...query);

    return result;
}


////////////////////////// API FUNCTIONALITIES
app.get("/api/pendingRequests", async (req, res) => {
    const pending_requests = await contract_query('getValuesForPartialKey', 'PENDING Request');
    res.send(pending_requests.toString());
})

app.get("/api/approvedRequests", (req, res) => {
})

app.get("/api/declinedRequests", (req, res) => {
})

app.post("/api/approve", (req, res) => {
})

app.post("/api/decline", (req, res) => {
})

app.post("/api/query", (req, res) => {
})

app.post("/api/login", (req, res) => {
    if(process.env.dev){

    } else {

    }
})

app.get("/api/invoke", async (req, res) => {
    const result = await contract_invoke('incrementTotalRequests');
    res.send("SUBMITTED!: "+result);
})

////////////////////////// DEFAULT
app.use((req, res, next) => {
    res.status(406)
        .send("ENDPOINT DOESN'T EXIST!");
})

////////////////////////// PORT, HTTP
app.listen(8000, (err) => {
    if(err){
        console.error(err);
    } else {
        console.info("Started on 3000");
    }
})
