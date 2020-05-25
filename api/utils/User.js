const sqlite3 = require('sqlite3').verbose();

class User{

    constructor(UserID=0, UserName='', Password='', EmailID='', Requests=[]){
        this.UserID = UserID;
        this.UserName = UserName;
        this.Password = Password;
        this.EmailID = EmailID;
        this.Requests = Requests;
    }

    static fromDBQueryResult(dbResult){
        return new User(
            dbResult.UserID, 
            dbResult.UserName, 
            dbResult.Password, 
            dbResult.EmailID, 
            JSON.parse(dbResult.Requests)
        );
    }

    static fromString(jsonString){
        let userFromString = JSON.parse(jsonString);
        return new User(
            userFromString.UserID, 
            userFromString.UserName, 
            userFromString.Password, 
            userFromString.EmailID, 
            userFromString.Requests
        );
    }

    toString(){
        return JSON.stringify(this);
    }

    static getDBInstance(){
        if(User.dbname){
            return new sqlite3.Database(User.dbname, sqlite3.OPEN_READWRITE, (err) => {
                if (err) console.error(err);
            })
        } else {
            throw new Error("User.dbname not instantiated.");
        }
    }

    static getUserFromDB(username){
        let db = User.getDBInstance();
        let sql = `SELECT * FROM users WHERE UserName='${username}'`
        return new Promise( (resolve, reject) => {
            db.get(sql, (err, row) => {
                db.close();
                if(!err){
                    if(!row) {
                        resolve({});
                    } else {
                        resolve(User.fromDBQueryResult(row));
                    }
                } else {
                    console.error(err);
                    reject(err);
                }
            })
        })
    }

    saveToDB(){
        let db = User.getDBInstance();
        let oldUserInstance = User.getDBInstance(this.UserName);
        return new Promise((resolve, reject) => {
            let sql;
            if(oldUserInstance !== {}){
                sql = `UPDATE users \
                       SET 
                           Password='${this.Password}',\
                           EmailID='${this.EmailID?this.EmailID:''}',\
                           Requests='${JSON.stringify(this.Requests)}'\
                       WHERE \
                           UserID='${oldUserInstance.UserID}'`
            } else {
                sql = `INSERT INTO users(UserName, Password, EmailID, Requests)\
                        VALUES('${this.UserName}', '${this.Password}', '${this.EmailID}',\ 
                        '${JSON.stringify(this.Requests)}')`
            }
            db.run(sql, (err) => {
                db.close();
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    }
}

User.dbname = undefined;

module.exports = User;