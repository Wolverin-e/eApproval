const register = require('./utils/register');
const sqlite3 = require('sqlite3').verbose();
let User = require('./utils/User');

User.dbname = './users.db'
let user = new User(UserName=process.env.USR, Password="123")
user.saveToDB().then(() => {
    register(process.env.USR, process.env.ORG);
})