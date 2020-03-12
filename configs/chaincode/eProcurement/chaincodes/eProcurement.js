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

    async getTotalRequests(stub) {
        let count = await stub.getState("totalRequests");
        return JSON.parse(count);
    }

    async incrementTotalRequests(stub) {
        let count = await this.getTotalRequests(stub);
        ++count;
        await stub.putState("totalRequests", Buffer.from(JSON.stringify(count)));
        return count;
    }

    async createRequest(ctx, from_user, title, description, requestedDepartments){
        const req = new Request();

        req.from_user = from_user;
        req.title = title;
        req.description = description;
        req.requestedDepartments = JSON.parse(requestedDepartments);
        req.constructApprovals();
        req.updateOverallStatus();

        let count = await this.incrementTotalRequests(ctx.stub);
        key = await ctx.stub.createCompositeKey('PENDING', ['Request', `${count}`]);
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