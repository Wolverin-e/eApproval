'use strict';

const { Contract } = require('fabric-contract-api');
const Request = require("./request");

class eProcurement extends Contract {

    constructor(){
        super("com.gov.eProcurement.approval");
    }

    async initLedger(ctx) {
        // Function to init
        await ctx.stub.putState("totalRequests", Buffer.from(JSON.stringify(0)));
    }

    async getTotalRequests(ctx) {
        let count = await ctx.stub.getState("totalRequests");
        return JSON.parse(count);
    }

    async incrementTotalRequests(ctx) {
        let count = await this.getTotalRequests(ctx);
        ++count;
        await ctx.stub.putState("totalRequests", Buffer.from(JSON.stringify(count)));
        return count;
    }

    async createRequest(ctx, from_user, title, description, requestedDepartments){
        const req = new Request();
        
        req.from_user = from_user;
        req.title = title;
        req.description = description;
        req.requestedDepartments = requestedDepartments.split(' ');
        req.constructApprovals();
        req.updateOverallStatus();
        
        let count = await this.incrementTotalRequests(ctx);
        let key = await ctx.stub.createCompositeKey('PENDING', ['Request', `${count}`]);
        await ctx.stub.putState(key, req.toBuffer());
    }

    async approveRequest(ctx, req_key, department, remarks){
        let req = await ctx.stub.getState(req_key);
        req = Request.from(req);
        req.approveFor(department, remarks);
        await ctx.stub.putState(req_key, req.toBuffer());
    }

    async declineRequest(ctx, req_key, department, remarks){
        let req = await ctx.stub.getState(req_key);
        req = Request.from(req);
        req.declineFor(department, remarks);
        await ctx.stub.putState(req_key, req.toBuffer());
    }
}

module.exports = eProcurement;


// test
// peer chaincode query -n eprocurement -C mychannel -c '{"function": "createRequest", "Args": ["alpha", "coal-mine", "coal-mine in INDIA", "[\"a1\", \"b1\"]"]}'