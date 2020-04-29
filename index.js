/* Require external APIs and start our application instance */
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var request = require('request');
var mysql = require('mysql'); 

/* Start the application server */
app.listen(process.env.PORT || 8080, process.env.IP, function () {
  console.log('Express server is running...');
});

/* Configure our server to read public folder and ejs files */
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

/* The handler for the DEFAULT route */
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.get('/createAccount', function (req, res) {
  res.render('createAccount');
});

app.get('/admin', function(req,res){
   res.render('admin');
});

app.get('/addGame', function(req, res){
	let game = req.query.search;
	const url = `https://api.rawg.io/api/games?search=${game}`;
	request(url, function(error, response, data){
		if (!error && response.statusCode == 200){
			data = JSON.parse(data);
			res.render('addGame', {games: data.results});
		}
	});
});

app.post("/addGame", async function(req, res){
  let rows = await insertGame(req.body);
  console.log(rows);
  let message = "Listing was not added to the database.";
  if (rows.affectedRows > 0) {
    message= "Listing successfully added!";
  }
  res.render("addGame", {"message":message});
});

function insertGame(body, group){
  let conn = dbConnection();
  return new Promise(function(resolve, reject){
    conn.connect(function(err) {
      if (err) throw err;
      console.log("Connected!: insertGame");
        
      let sql = `INSERT INTO listings
                        (title, genre, image_url, price, seller_username)
                         VALUES (${body.title}, ${body.genre}, ${body.imageURL}, ${body.price}, ${body.username})`;
        
      conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
      });
      console.log(sql);
        
        });
    });
}

/* The handler for undefined routes */
app.get('*', function (req, res) {
  res.render('index');
});

function dbConnection() {
  let conn = mysql.createConnection({
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'hltrq8vzmqp59xkg',
    password: 'jwcyw01pmul3jelj',
    database: 'test',
  }); //createConnection

  return conn;
}



