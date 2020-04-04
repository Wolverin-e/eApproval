const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors())

app.get("/api/pendingRequests", (req, res) => {
    res.send({
        "success": true,
        "response": "[{\"Key\":[\"PENDING\",\"Request\",\"3\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"}},\\\"description\\\":\\\"Ice-cream Factory inside Town.\\\",\\\"from_user\\\":\\\"Gamma\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"PENDING\\\",\\\"title\\\":\\\"Ice-cream Factory\\\"}\"},{\"Key\":[\"PENDING\",\"Request\",\"4\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"}},\\\"description\\\":\\\"Coal mine inside Town.\\\",\\\"from_user\\\":\\\"Delta\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"PENDING\\\",\\\"title\\\":\\\"Coal mine\\\"}\"},{\"Key\":[\"PENDING\",\"Request\",\"5\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"}},\\\"description\\\":\\\"I want to create .....\\\",\\\"from_user\\\":\\\"Mitul\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"PENDING\\\",\\\"title\\\":\\\"Plastic Factory\\\"}\"}]"
    })
})

app.get("/api/approvedRequests", (req, res) => {
    res.send({
        "success": true,
        "response": "[{\"Key\":[\"APPROVED\",\"Request\",\"1\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"Good!\\\",\\\"status\\\":\\\"APPROVED\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"Good!\\\",\\\"status\\\":\\\"APPROVED\\\"}},\\\"description\\\":\\\"Tower Outside of Town.\\\",\\\"from_user\\\":\\\"Alpha\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"APPROVED\\\",\\\"title\\\":\\\"Cell Phone Tower\\\"}\"}]"
    })
})

app.get("/api/declinedRequests", (req, res) => {
    res.send({
        "success": true,
        "response": "[{\"Key\":[\"DECLINED\",\"Request\",\"2\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"Harmful!!\\\",\\\"status\\\":\\\"DECLINED\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"\\\",\\\"status\\\":\\\"PENDING\\\"}},\\\"description\\\":\\\"Chemical Factory Inside Town.\\\",\\\"from_user\\\":\\\"Beta\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"DECLINED\\\",\\\"title\\\":\\\"Chemical Factory\\\"}\"},{\"Key\":[\"DECLINED\",\"Request\",\"5\"],\"Val\":\"{\\\"approvals\\\":{\\\"ORG1\\\":{\\\"remarks\\\":\\\"GOOD!\\\",\\\"status\\\":\\\"APPROVED\\\"},\\\"ORG2\\\":{\\\"remarks\\\":\\\"HARMFUL!\\\",\\\"status\\\":\\\"DECLINED\\\"}},\\\"description\\\":\\\"I want to create .....\\\",\\\"from_user\\\":\\\"Mitul\\\",\\\"requestedDepartments\\\":[\\\"ORG1\\\",\\\"ORG2\\\"],\\\"status\\\":\\\"DECLINED\\\",\\\"title\\\":\\\"Plastic Factory\\\"}\"}]"
    })
})

app.post("api/createRequest", (req, res) => {
    // { // Request BODY
    //     "from_user": "Mitul", 
    //     "title": "Plastic Factory", 
    //     "descriptions": "I want to create .....", 
    //     "requestedDepartments": "ORG1 ORG2"
    // }
    res.send({
        "success": true
    })
})

app.post("api/approve", (req, res) => {
    // { // Request BODY
    //     "req_key": "PENDING Request 5", 
    //     "department": "ORG1",
    //     "remarks": "GOOD!"
    // }
    res.send({
        "success": true
    })
})

app.post("api/decline", (req, res) => {
    // { // Request BODY
    //     "req_key": "PENDING Request 5", 
    //     "department": "ORG2", 
    //     "remarks": "HARMFUL!"
    // }
    res.send({
        "success": true
    })
})

app.listen(8000, (err) => {
    if(err){
        console.log(err);
    } else {
        console.log("Started on port 8000");
    }
})