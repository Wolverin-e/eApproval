'use strict';

const { Contract } = require('fabric-contract-api');
const Request = require("./request");

const createCompositeKey = keys => {
    return keys.join('|');
}

class eApproval extends Contract {

    constructor() {
        super("com.gov.eApproval.approval");
    }

    async initLedger(ctx) {
        // Function to init
        let key = createCompositeKey(["total", "Requests"]);
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(0)));
    }
    
    async getTotalRequests(ctx) {
        let key = createCompositeKey(["total", "Requests"]);
        let count = await ctx.stub.getState(key);
        return JSON.parse(count);
    }

    async incrementTotalRequests(ctx) {
        let key = createCompositeKey(["total", "Requests"]);
        let count = await this.getTotalRequests(ctx);
        ++count;
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(count)));
        return count;
    }

    async createRequest(ctx, from_user, title, description, user_proposal, requestedDepartments) {
        const req = new Request();
        
        req.from_user = from_user;
        req.title = title;
        req.description = description;
        req.user_proposal = JSON.parse(user_proposal);
        req.requestedDepartments = JSON.parse(requestedDepartments); //better send as a stringified list
        req.constructApprovals();
        req.updateOverallStatus();
        
        const count = await this.incrementTotalRequests(ctx);
        let key = createCompositeKey(['PENDING', 'Request', `${count}`]);
        await ctx.stub.putState(key, req.toBuffer());
    }

    async approveRequest(ctx, req_key, department, remarks, pvtRemarks) {
        // req_key in format PENDING|Request|1
        let req = await ctx.stub.getState(req_key);

        req = Request.from(req);
        req.approveFor(department, JSON.parse(remarks?remarks:'{}'), JSON.parse(pvtRemarks?pvtRemarks:'{}'));

        let new_key;
        if(req.status === "APPROVED"){
            await ctx.stub.deleteState(req_key);
            new_key = createCompositeKey([req.status].concat(req_key.split("|").slice(1)));
        } else {
            new_key = req_key;
        }
        await ctx.stub.putState(new_key, req.toBuffer());
    }
    
    async declineRequest(ctx, req_key, department, remarks, pvtRemarks) {
        // req_key in format PENDING|Request|1
        let req = await ctx.stub.getState(req_key);
        
        req = Request.from(req);
        req.declineFor(department, JSON.parse(remarks?remarks:'{}'), JSON.parse(pvtRemarks?pvtRemarks:'{}'));

        let new_key = createCompositeKey(["DECLINED"].concat(req_key.split("|").slice(1)));
        await ctx.stub.deleteState(req_key);
        await ctx.stub.putState(new_key, req.toBuffer());
    }

    async getValueForKey(ctx, req_key) {
        // req_key in format PENDING|Request|1
        let user_org = await ctx.clientIdentity.getAttributeValue('org');
        let val = await ctx.stub.getState(req_key);
        let request = Request.from(val);
        for(let k in request.privateDataSet){
            if(k !== user_org){
                delete request.privateDataSet[k];
            }
        }

        if (Buffer.isBuffer(val) && !val.length) {
            return request.toJson();
        } else {
            return "!!!------- EMPTY KEY VALUE PAIR -------!!!!";
        }
    }

    async getValuesForPartialKey(ctx, req_partial_key) {
        // req_partial_key should be sent in JSON ["PENDING", "Request"]
        req_partial_key = JSON.parse(req_partial_key);
        let user_org = await ctx.clientIdentity.getAttributeValue('org');
        let query = JSON.stringify({
            "selector": {
                "_id": {
                    "$regex": req_partial_key.join('.')
                }
            }
        })
        let results = [];
        for await ( const {key, value} of ctx.stub.getQueryResult(query) ) {
            let request = Request.from(value);
            for(let k in request.privateDataSet){
                if(k !== user_org){
                    delete request.privateDataSet[k];
                }
            }
            results.push({
                Key: key,
                Val: request // Removed .toJson()
            });
        }
        return JSON.stringify(results);
    }

    async getRichQueryResult(ctx, query){
        let user_org = await ctx.clientIdentity.getAttributeValue('org');
        let results = {};
        for await (const {key, value} of ctx.stub.getQueryResult(query)) {
            let request = Request.from(value);
            for(let k in request.privateDataSet){
                if(k !== user_org){
                    delete request.privateDataSet[k];
                }
            }
            results[key] = request; // Removed .toJson()
        }
        return JSON.stringify(results); // added stringify
    }

    async returnMe(ctx, custom){
        var vals = {}
        vals['id'] = await ctx.clientIdentity.getID();
        vals['mspid'] = await ctx.clientIdentity.getMSPID();
        vals['custom'] = await ctx.clientIdentity.getAttributeValue(custom);
        return JSON.stringify(vals);
    }
}

module.exports = eApproval;
