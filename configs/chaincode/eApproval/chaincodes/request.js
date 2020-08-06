'use strict';

class Request {
    constructor(){
        this.from_user = '';
        this.title = '';
        this.description = '';
        this.status = '';
        this.approvals = {};
        this.requestedDepartments = [];
        
        this.privateDataSet = {};
        this.user_proposal = {}; // Manually defined File obj
        this.remarks = {};
    }

    static from(bufferOrJson){
        if(Buffer.isBuffer(bufferOrJson)){
            if(!bufferOrJson.length){
                return;
            }

            bufferOrJson = JSON.parse(bufferOrJson.toString('utf-8'));
        }

        let request = new Request();
        request.from_user = bufferOrJson.from_user;
        request.title = bufferOrJson.title;
        request.description = bufferOrJson.description;
        request.requestedDepartments = bufferOrJson.requestedDepartments;
        request.approvals = bufferOrJson.approvals;
        request.status = bufferOrJson.status;
        request.privateDataSet = bufferOrJson.privateDataSet;
        request.user_proposal = bufferOrJson.user_proposal;
        request.remarks = bufferOrJson.remarks;
        
        return request;
    }

    toJson(){
        return JSON.stringify(this);
    }

    toBuffer(){
        return Buffer.from(this.toJson());
    }

    constructApprovals() {
        this.requestedDepartments.map( dept => {
            this.approvals[dept] = {
                "status": "PENDING"
            }
        });
    }

    getOverallStatus() {
        let status = ""
        for (let key in this.approvals){
            let ind_status = this.approvals[key].status;
            switch(ind_status){
                case "DECLINED":
                    return "DECLINED";
                case "PENDING":
                    status = "PENDING";
                    break;
                default:
                    break;
            }
        }

        return (status === "PENDING")?"PENDING":"APPROVED";
    }

    updateOverallStatus(){
        this.status = this.getOverallStatus();
    }

    approveFor(department, remarks={}, pvtRemarks={}){
        this.approvals[department].status = "APPROVED";
        this.remarks[department] = remarks;
        this.privateDataSet[department] = pvtRemarks;
        this.updateOverallStatus();
    }
    
    declineFor(department, remarks={}, pvtRemarks={}){
        this.approvals[department].status = "DECLINED";
        this.remarks[department] = remarks;
        this.privateDataSet[department] = pvtRemarks;
        this.updateOverallStatus();
    }
}

module.exports = Request;
