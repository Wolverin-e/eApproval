const register = require('./register');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) =>{
    if(err) console.error(err);
})

let register_sql = `INSERT INTO users(UserName, Password, EmailID) \
                            VALUES("${process.env.USR}", "123", "")`;
db.run(register_sql, (err) => {
    if(err){
        console.error(err);
    }
})

register(process.env.USR, process.env.ORG);