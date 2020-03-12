a = ["b", "c", "d"]
b = {}

a.map( dept => {
    b[dept] = {
        "status": "PENDING", 
        "remarks": ""
    }
});
// console.log(JSON.stringify(b));

function getStat(requestObj = {}) {
    status = ""
    for (let key in requestObj){
        let ind_status = requestObj[key].status;
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

console.log(getStat(b))