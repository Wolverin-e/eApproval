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

    async approveRequest(ctx, req_key, department, remarks) {
        req_key = req_key.split(" ")
        let key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
        let req = await ctx.stub.getState(key);

        req = Request.from(req);
        req.approveFor(department, remarks);

        let new_key;
        if(req.status === "APPROVED"){
            await ctx.stub.deleteState(key);
            new_key = ctx.stub.createCompositeKey(req.status, req_key.slice(1));
        } else {
            new_key = key;
        }
        await ctx.stub.putState(new_key, req.toBuffer());
    }
    
    async declineRequest(ctx, req_key, department, remarks) {
        req_key = req_key.split(" ")
        let key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
        let req = await ctx.stub.getState(key);
        
        req = Request.from(req);
        req.declineFor(department, remarks);

        let new_key = ctx.stub.createCompositeKey("DECLINED", req_key.slice(1));
        await ctx.stub.deleteState(key);
        await ctx.stub.putState(new_key, req.toBuffer());
    }

    async getValueForKey(ctx, req_key) {
        req_key = req_key.split(" ")
        req_key = ctx.stub.createCompositeKey(req_key[0], req_key.slice(1));
        let val = await ctx.stub.getState(req_key);

        if (Buffer.isBuffer(val) && !val.length) {
            return JSON.stringify(Buffer.from(val).toString('utf-8'));
        } else {
            return "!!!------- EMPTY KEY VALUE PAIR -------!!!!";
        }
    }

    async getValuesForPartialKey(ctx, req_partial_key) {
        req_partial_key = req_partial_key.split(" ");
        let results = [];
        for await ( const {key, value} of ctx.stub.getStateByPartialCompositeKey(req_partial_key[0], req_partial_key.slice(1))) {
            results.push({
                Key: key.split("\u0000").slice(1,-1),
                Val: Buffer.from(value).toString("utf-8")
            });
        }
        return JSON.stringify(results);
    }
}

module.exports = eProcurement;
