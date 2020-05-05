const express = require('express');
var mysql = require('mysql');
const router = express.Router();
router.get('/username/:name',async function(req, res, next) {
  let users = await  userexist(req.params.name);
  let userNameTaken = users.length >0? users[0].username :'';
  console.log("inside lookup");
  console.log(userNameTaken);
  console.log(users);
    if ( users.length >0) {
        res.status(200).send("Unavailable");
    }
    else {
        res.status(200).send("Available");
    }
});

module.exports = router;
function userexist(username){
  let stmt ='SElECT * FROM users where username=?';
  let conn = dbConnection();
  return new Promise(function(resolve,reject){
    conn.query(stmt,[username],function(error, results) {
        if(error) throw error;
      resolve(results);
      conn.destroy();
    });
    
  });
  
}
function dbConnection() {
  let conn = mysql.createConnection({
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'hltrq8vzmqp59xkg',
    password: 'jwcyw01pmul3jelj',
    database: 'test',
  }); //createConnection

  return conn;
}
