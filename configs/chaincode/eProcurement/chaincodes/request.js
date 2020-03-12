'use strict';

class Request {
    constructor(){
        this.from_user = '';
        this.title = '';
        this.description = '';
        this.status = '';
        this.approvals = {};
        this.requestedDepartments = [];
    }

    static from(bufferOrJson){
        if(Buffer.isBuffer(bufferOrJson)){
            if(!bufferOrJson.length){
                return;
            }

            bufferOrJson = JSON.parse(bufferOrJson.toString('utf-8'));
        }

        const result = new Request();
        result.from_user = bufferOrJson.from_user;
        result.title = bufferOrJson.title;
        result.description = bufferOrJson.description;
        result.requestedDepartments = bufferOrJson.requestedDepartments;
        result.approvals = bufferOrJson.approvals;
        result.status = bufferOrJson.status;
        
        return result;
    }

    toJson(){
        return JSON.stringify(this);
    }

    toBuffer(){
        return Buffer.from(this.toJson);
    }

    constructApprovals() {
        this.requestedDepartments.map( dept => {
            this.approvals[dept] = {
                "status": "PENDING", 
                "remarks": ""
            }
        });
    }

    getOverallStatus() {
        status = ""
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

    approveFor(department, remarks){
        this.approvals[department].status = "APPROVED";
        this.approvals[department].remarks = remarks;
        this.updateOverallStatus();
    }
    
    declineFor(department, remarks){
        this.approvals[department].status = "DECLINED";
        this.approvals[department].remarks = remarks;
        this.updateOverallStatus();
    }
}

module.exports = Request;
