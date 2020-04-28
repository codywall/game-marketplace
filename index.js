/* Require external APIs and start our application instance */
var express = require('express');
var app = express();
var request = require('request');


/* Configure our server to read public folder and ejs files */
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

app.get('/results', function(req, res){
	let game = req.query.search;
	const url = `https://api.rawg.io/api/games?search=${game}`;
	request(url, function(error, response, data){
		if (!error && response.statusCode == 200){
			data = JSON.parse(data);
			res.render('results', {games: data.results});
		}
	});
});
/* The handler for undefined routes */
app.get('*', function (req, res) {
  res.render('index');
});

/* Start the application server */
app.listen(process.env.PORT || 8080, process.env.IP, function () {
  console.log('Express server is running...');
});
