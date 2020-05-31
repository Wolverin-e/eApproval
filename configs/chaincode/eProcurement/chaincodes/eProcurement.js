'use strict';

const { Contract } = require('fabric-contract-api');
const Request = require("./request");

class eProcurement extends Contract {

    constructor() {
        super("com.gov.eProcurement.approval");
    }

    async initLedger(ctx) {
        // Function to init
        let key = ctx.stub.createCompositeKey("total", ["Requests"]);
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(0)));
    }
    
    async getTotalRequests(ctx) {
        let key = ctx.stub.createCompositeKey("total", ["Requests"]);
        let count = await ctx.stub.getState(key);
        return JSON.parse(count);
    }

    async incrementTotalRequests(ctx) {
        let key = ctx.stub.createCompositeKey("total", ["Requests"]);
        let count = await this.getTotalRequests(ctx);
        ++count;
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(count)));
        return count;
    }

    async createRequest(ctx, from_user, title, description, requestedDepartments) {
        const req = new Request();
        
        req.from_user = from_user;
        req.title = title;
        req.description = description;
        req.requestedDepartments = requestedDepartments.split(' ');
        req.constructApprovals();
        req.updateOverallStatus();
        
        const count = await this.incrementTotalRequests(ctx);
        let key = await ctx.stub.createCompositeKey('PENDING', ['Request', `${count}`]);
        await ctx.stub.putState(key, req.toBuffer());
    }

    async approveRequest(ctx, req_key, department, remarks, pvtRemarks) {
        req_key = req_key.split(" ")
        let key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
        let req = await ctx.stub.getState(key);

        req = Request.from(req);
        req.approveFor(department, remarks, JSON.parse(pvtRemarks?pvtRemarks:'{}'));

        let new_key;
        if(req.status === "APPROVED"){
            await ctx.stub.deleteState(key);
            new_key = ctx.stub.createCompositeKey(req.status, req_key.slice(1));
        } else {
            new_key = key;
        }
        await ctx.stub.putState(new_key, req.toBuffer());
    }
    
    async declineRequest(ctx, req_key, department, remarks, pvtRemarks) {
        req_key = req_key.split(" ")
        let key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
        let req = await ctx.stub.getState(key);
        
        req = Request.from(req);
        req.declineFor(department, remarks, JSON.parse(pvtRemarks?pvtRemarks:'{}'));

        let new_key = ctx.stub.createCompositeKey("DECLINED", req_key.slice(1));
        await ctx.stub.deleteState(key);
        await ctx.stub.putState(new_key, req.toBuffer());
    }

    async getValueForKey(ctx, req_key) {
        req_key = req_key.split(" ")
        req_key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
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
        req_partial_key = req_partial_key.split(" ");
        let user_org = await ctx.clientIdentity.getAttributeValue('org');
        let results = [];
        for await ( const {key, value} of ctx.stub.getStateByPartialCompositeKey(req_partial_key[0], req_partial_key.slice(1))) {
            let request = Request.from(value);
            for(let k in request.privateDataSet){
                if(k !== user_org){
                    delete request.privateDataSet[k];
                }
            }
            results.push({
                Key: key.split("\u0000").slice(1,-1),
                Val: request.toJson()
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
            results[key.split("\u0000").slice(1,-1).join(' ')] = request.toJson();
        }
        return results;
    }

    async returnMe(ctx, custom){
        var vals = {}
        vals['id'] = await ctx.clientIdentity.getID();
        vals['mspid'] = await ctx.clientIdentity.getMSPID();
        vals['custom'] = await ctx.clientIdentity.getAttributeValue(custom);
        return JSON.stringify(vals);
    }
}

module.exports = eProcurement;
