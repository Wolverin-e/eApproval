const express = require('express');
const cors = require("cors");
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const getCCP = require('./ccp');


/////////////////////////// API
const app = express();
app.use(express.json());
app.use(cors())

/////////////////////////// TEST FUNCTIONALITIES

// TEST for environment variables
if(!process.env.test){
    throw new Error("ENVs NOT FLUSHED");
}

// TEST to check if API is Working or not
app.get("/test", (req, res) => {
    res.send({
        success: true
    });
})


////////////////////////// CONFS
const ccp = getCCP(process.env.ORG);
const walletPath = path.join(process.cwd(), 'wallet');
var wallet;
Wallets.newFileSystemWallet(walletPath).then(wlt => {
    wallet = wlt;
})

const contract_query = async (...query) => {
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: process.env.USR, 
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
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: process.env.USR, 
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
    res.send({
        success: true, 
        response: pending_requests.toString()
    });
})

app.get("/api/approvedRequests", async (req, res) => {
    const approved_requests = await contract_query('getValuesForPartialKey', 'APPROVED Request');
    res.send({
        success: true, 
        response: approved_requests.toString()
    });
})

app.get("/api/declinedRequests", async (req, res) => {
    const declined_requests = await contract_query('getValuesForPartialKey', 'DECLINED Request');
    res.send({
        success: true, 
        response: declined_requests.toString()
    });
})

app.post("/api/createRequest", async (req, res) => {
    const from_user = req.body.from_user;
    const title = req.body.title;
    const descriptions = req.body.descriptions;
    const requestedDepartments = req.body.requestedDepartments;
    await contract_invoke('createRequest', from_user, title, descriptions, requestedDepartments);
    res.send({
        success: true
    });
})

app.post("/api/approve", async (req, res) => {
    const req_key = req.body.req_key;
    const department = req.body.department;
    const remarks = req.body.remarks;
    await contract_invoke('approveRequest', req_key, department, remarks);
    res.send({
        success: true
    });
})

app.post("/api/decline", async (req, res) => {
    const req_key = req.body.req_key;
    const department = req.body.department;
    const remarks = req.body.remarks;
    await contract_invoke('declineRequest', req_key, department, remarks);
    res.send({
        success: true
    });
})

app.post("/api/query", async (req, res) => {
    const qry = req.body.qry;
    const result = await contract_query(...qry);
    res.send({
        success: true, 
        result
    });
})

app.get("/api/invoke", async (req, res) => {
    const invoke_query = req.body.invoke_query;
    const result = await contract_invoke(...invoke_query);
    res.send({
        success: true, 
        result
    });
})

app.post("/api/login", (req, res) => {
    if(process.env.dev){
    } else {
    }
})

////////////////////////// DEFAULT
app.use((req, res, next) => {
    res.status(406).send({
        success: false, 
        path: req.path, 
        err: "Endpoint Doesn't exist!"
    });
})

////////////////////////// PORT, HTTP
app.listen(8000, (err) => {
    if(err){
        console.error(err);
    } else {
        console.info("Started on 3000");
    }
})
