const app = require('express')();


/////////////////////////// TEST FUNCTIONALITIES

// TEST for environment variables
if(!process.env.test){
    throw new Error("ENVs NOT FLUSHED");
}

// TEST to check if API is Working or not
app.get("/test", (req, res) => {
    res.send("Working");
})


////////////////////////// API FUNCTIONALITIES
app.get("/api/pendingRequests", (req, res) => {
})

app.get("/api/approvedRequests", (req, res) => {
})

app.get("/api/declinedRequests", (req, res) => {
})

app.post("/api/approve", (req, res) => {
})

app.post("/api/decline", (req, res) => {
})

app.post("/api/query", (req, res) => {
})

app.post("/api/login", (req, res) => {
    if(process.env.dev){

    } else {

    }
})

////////////////////////// DEFAULT
app.use((req, res, next) => {
    res.status(406)
        .send("ENDPOINT DOESN'T EXIST!");
})

////////////////////////// PORT, HTTP
app.listen(8000, (err) => {
    if(err){
        console.error(err);
    } else {
        console.info("Started on 3000");
    }
})
