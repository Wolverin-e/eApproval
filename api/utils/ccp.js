const fs = require("fs");
const path = require("path");

const getCCP = org => {
    const ccpPath = path.resolve(__dirname, "..", "..", "configs",
                                     "ccp", `connection-${org}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
    return ccp
}

module.exports = getCCP;