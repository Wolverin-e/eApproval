const express = require('express');
const cors = require("cors");
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const getCCP = require('./utils/ccp');
const registerCA = require('./utils/register');
let User = require('./utils/User');
User.dbname='./users.db';

/////////////////////////// API
const app = express();
app.use(express.json());
app.use(cors())

/////////////////////////// DB
let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err) console.error(err);
})

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

const contract_query = async (user, ...query) => {
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: user, 
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

const contract_invoke = async (user, ...query) => {
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet: wallet, 
        identity: user, 
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
const exceptions = ['/api/login', '/api/register'];
const secret_key = process.env.secret_key;
let tkn_cache = [];

const get_tkn = user_profile => {
    return jwt.sign(user_profile, secret_key, {algorithm: "HS512"});
}

const verify_tkn = (req, res, next) => {
    jwt.verify(req.headers.tkn, secret_key, (err, decrypted_profile) => {
        if((!err) && tkn_cache.includes(decrypted_profile.UserName)){
            req.headers.user_profile = decrypted_profile;
            req.headers.user = decrypted_profile.UserName;
            next();
        } else {
            res.status(401).send("JWT Verification Failed!");
        }
    })
}

const login = (req, res) => {
    if(req.body.UserName && req.body.Password){
        let login_sql = `SELECT * FROM users WHERE UserName="${req.body.UserName}"`;
        db.get(login_sql, (err, row) => {
            if(!err && row && row.Password === req.body.Password){
                delete row.Password;
                if(! tkn_cache.includes(row.UserName)) tkn_cache.push(row.UserName);
                res.send({
                    ...row, 
                    tkn: get_tkn(row)
                });
            } else if(!row){
                res.status(401).send("User Doesn't Exists");
            } else {
                res.status(401).send("UserName/Password Doesn't Match.");
            }
        })
    } else {
        res.status(401).send("Username & Password Not Attched.");
    }
}

////////////////////////// API ROUTES
app.use((req, res, next) => {
    if(!(process.env.auth_disabled === "true")){
        if(exceptions.includes(req.path)){
            next();
        } else {
            verify_tkn(req, res, next);
        }
    } else {
        req.headers.user = process.env.USR;
        next();
    }
})

app.get("/api/pendingRequests", async (req, res) => {
    const pending_requests = await contract_query(req.headers.user, 'getValuesForPartialKey', 'PENDING Request');
    res.send({
        success: true, 
        response: pending_requests.toString()
    });
})

app.get("/api/approvedRequests", async (req, res) => {
    const approved_requests = await contract_query(req.headers.user, 'getValuesForPartialKey', 'APPROVED Request');
    res.send({
        success: true, 
        response: approved_requests.toString()
    });
})

app.get("/api/declinedRequests", async (req, res) => {
    const declined_requests = await contract_query(req.headers.user, 'getValuesForPartialKey', 'DECLINED Request');
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
    await contract_invoke(req.headers.user, 'createRequest', from_user, title, descriptions, requestedDepartments);
    res.send({
        success: true
    });
})

app.post("/api/approve", async (req, res) => {
    const req_key = req.body.req_key;
    const department = req.body.department;
    const remarks = req.body.remarks;
    const pvtRemarks = req.body.pvtRemarks;
    await contract_invoke(req.headers.user, 'approveRequest', req_key, department, remarks, JSON.stringify(pvtRemarks?pvtRemarks:'{}'));
    res.send({
        success: true
    });
})

app.post("/api/decline", async (req, res) => {
    const req_key = req.body.req_key;
    const department = req.body.department;
    const remarks = req.body.remarks;
    const pvtRemarks = req.body.pvtRemarks;
    await contract_invoke(req.headers.user, 'declineRequest', req_key, department, remarks, JSON.stringify(pvtRemarks?pvtRemarks:'{}'));
    res.send({
        success: true
    });
})

app.post("/api/query", async (req, res) => {
    const qry = req.body.qry;
    console.log(typeof(qry), qry)
    const result = await contract_query(req.headers.user, ...qry);
    res.send({
        success: true, 
        result: result.toString()
    });
})

app.get("/api/invoke", async (req, res) => {
    const invoke_query = req.body.invoke_query;
    const result = await contract_invoke(req.headers.user, ...invoke_query);
    res.send({
        success: true, 
        result: result.toString()
    });
})

app.post("/api/runRichQuery", async(req, res) => {
    const richQuery = JSON.stringify(req.body.richQuery);
    const result = await contract_query(req.headers.user, "getRichQueryResult", richQuery);
    res.send({
        success: true, 
        result: result.toString()
    });
})

app.post("/api/login", (req, res) => {
    login(req, res);
})

app.post("/api/register", async (req, res) => {
    if(req.body.UserName && req.body.Password){
        let user = new User(0, req.body.UserName, req.body.Password);
        await user.saveToDB()
        await registerCA(req.body.UserName, process.env.ORG);
        login(req, res);
    } else {
        res.send("Registration: Username & Password Not Attched!");
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
        console.info("Started on 8000");
    }
})
