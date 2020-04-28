/* Require external APIs and start our application instance */
var express = require('express');
var app = express();

/* Configure our server to read public folder and ejs files */
app.use(express.static('public'));
app.set('view engine', 'ejs');



/* The handler for the DEFAULT route */
app.get('/', function(req, res){
   res.render('index'); 
});


app.get('/login', function(req, res){
   res.render('login'); 
});


app.get('/createAccount', function(req, res){
   res.render('createAccount'); 
});



/* The handler for undefined routes */
app.get('*', function(req, res){
   res.render('index'); 
});

/* Start the application server */
app.listen("8080","127.0.0.1",function(){
    console.log("running");
});