const register = require('./utils/register');
let User = require('./utils/User');

User.dbname = './users.db'
let user = new User(0, process.env.USR, Password="123")
user.saveToDB().then(() => {
    register(process.env.USR, process.env.ORG);
}).catch(console.log)