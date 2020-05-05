/* Require external APIs and start our application instance */

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var request = require('request');
var mysql = require('mysql');
var session = require('express-session');
var bcrypt = require('bcrypt');
var lookupRouter = require('./lookup');
var methodOverride = require('method-override');
var isLogedin = require('./isLogedin');

/* Start the application server */
app.listen(process.env.PORT || 8080, process.env.IP, function () {
  console.log('Express server is running...');
});

/* Configure our server to read public folder and ejs files */
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(
  session({
    secret: 'top secret!',
    resave: true,
    saveUnitialized: true,
  })
);
app.use('/lookup', lookupRouter);

app.use('/isLogedin', isLogedin);
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

/* The handler for the DEFAULT route */
app.get('/', async function (req, res) {
  let games = await getAllGames();
  res.render('index', { games: games });
});

app.get('/title', async function (req, res) {
  let title = req.query.title;
  let games = await getGamebyTitle(title);
  console.log('titles: ' + games);
  console.log('fetching games by title...');
  res.render('index', { games: games });

  //var stmt = 'SELECT * FROM listings WHERE title=\'' + req.body.title + '%\';';
});

app.get('/genre', async function (req, res) {
  let genre = req.query.genre;
  let games = await getGamebyGenre(genre);
  console.log('titles: ' + games);
  console.log('fethcing games by genre...');
  res.render('index', { games: games });
});

app.get('/price', async function (req, res) {
  let range = req.query.myRange;
  let games = await getGamebyPrice(range);
  console.log(games);
  console.log(range);
  res.render('index', { games: games });
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.get('/createAccount', function (req, res) {
  res.render('createAccount');
});

app.get('/admin', isAuthenticated, async function (req, res) {
  let user = req.session.user;
  let games = await getGames(user);
  console.log(games);
  res.render('admin', { games: games, user: user });
  console.log('USER: ' + user);
});

app.get('/logout', function (req, res) {
  console.log('user has been logged out!');
  res.render('login');
  req.session.destroy();
});

app.get('/game/:listing_id/edit', async function (req, res) {
  let user = req.session.user; //to get current user
  let games = await getGames(user); //to put images
  console.log('games:' + games);
  var stmt =
    'SELECT * FROM listings WHERE listing_id=' + req.params.listing_id + ';';
  conn.query(stmt, function (error, result) {
    if (error) throw error;
    if (result.length) {
      var game = result[0];
      //game.title = game.
      //game.price
    }
    res.render('edit', { game: game, user: user, games: games });
  });
});

app.put('/game/:listing_id', function (req, res) {
  console.log(req.body);
  console.log(req.body.title);

  var stmt =
    'UPDATE listings SET ' +
    'title = "' +
    req.body.Title +
    '",' +
    'genre = "' +
    req.body.Genre +
    '",' +
    'price = "' +
    req.body.Price +
    '"' +
    'WHERE listing_id = ' +
    req.params.listing_id +
    ';';

  conn.query(stmt, function (error, result) {
    if (error) throw error;
    res.redirect('/admin');
  });
});

app.get('/game/:listing_id/delete', function (req, res) {
  var stmt =
    'DELETE FROM listings WHERE listing_id =' + req.params.listing_id + ';';
    
  conn.query(stmt, function (error, result) {
    if (error) throw error;
    
    res.redirect('/admin');
  });
});

app.get('/game/:listing_id/buy', function (req, res) {
  
  var stmt = `INSERT INTO sold (listing_id)
              SELECT listing_id
              FROM listings 
              WHERE listing_id =${req.params.listing_id};`;
  let stmt2 = `DELETE FROM listings
              WHERE listing_id =${req.params.listing_id};`;
  conn.query(stmt, function (error, result) {
    if (error) throw error;
  });
  conn.query(stmt2, function (error, result) {
    if (error) throw error;
    res.redirect('/');
  });
  
});


app.get('/addGame', isAuthenticated, function (req, res) {
  let game = req.query.search;

  let user = req.session.user;
  const url = `https://api.rawg.io/api/games?search=${game ? game : ''}`;
  request(url, function (error, response, data) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(data);
      res.render('addGame', { games: data.results, user: user });
    }
  });
});

app.post('/addGame', async function (req, res) {
  let rows = await insertGame(req.body);
  console.log(rows);
  let message = { text: 'Listing was not added to the database.' };
  message.success = false;
  if (rows.affectedRows > 0) {
    message.text = 'Listing successfully added!';
    message.success = true;
  }
  let games = await getGames(req.body.username);
  console.log('fetching your games...');
  res.render('admin', { games: games, message: message });
});

function getAllGames() {
  return new Promise(function (resolve, reject) {
      console.log('Connected!');
      let sql = `SELECT *
                    FROM listings
                    ORDER BY listing_id DESC`;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        resolve(rows);
      });
    });
}
function getGames(user) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!');
      let sql = `SELECT *
                         FROM listings
                         WHERE seller_username LIKE '${user}'
                         ORDER BY listing_id DESC `;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        resolve(rows);
      });
    });
}

function getGamebyTitle(title) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!');
      let sql = `SELECT *
                         FROM listings
                         WHERE title LIKE '%${title}%'
                         ORDER BY listing_id DESC `;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        resolve(rows);
      });
  });
}

function getGamebyGenre(genre) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!');
      let sql = `SELECT *
                         FROM listings
                         WHERE genre LIKE '${genre}'
                         ORDER BY listing_id DESC `;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        resolve(rows);
      });
  });
}

function getGamebyPrice(price) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!');
      let sql = `SELECT *
                         FROM listings
                         WHERE price BETWEEN 0 AND '${price}'
                         ORDER BY listing_id DESC `;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        resolve(rows);
      });
  });
}

function getSingleGame(user, game) {
  return new Promise(function (resolve, reject) {
      console.log('Connected');
      let sql = `Select *
                    From listings
                    Where seller_username LIKE '${user}'
                    and title LIKE '${game}'`;
      conn.query(sql, function (err, rows) {
        if (err) throw err;
        console.log(resolve);
        resolve(rows);
      });
    });
}

function insertGame(body) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!: insertGame');
      let sql = `INSERT INTO listings
                        (title, genre, image_url, price, seller_username)
                         VALUES ('${body.title}', '${body.genre}', '${body.imageURL}', ${body.price}, '${body.username}')`;
      conn.query(sql, function (err, rows, fields) {
        if (err) throw err;
        resolve(rows);
      });
    });
}

app.get('/cart', function (req, res) {
  res.render('cart');
});
/* The handler for undefined routes */
app.get('*', async function (req, res) {
  let games = await getAllGames();
  res.render('index', { games: games });
});


  let conn = mysql.createConnection({
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'hltrq8vzmqp59xkg',
    password: 'jwcyw01pmul3jelj',
    database: 'test',
  }); //createConnection

conn.connect();

app.post('/createAccount', async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let name = req.body.firstName;
  let lastName = req.body.lastName;
  let repeatPassword = req.body.repeatPassword;
  let salt = 10;

  let passwordMatch = await compare(password, repeatPassword);
  console.log('account created');
  if (passwordMatch) {
    bcrypt.hash(password, salt, function (error, hash) {
      if (error) throw error;
      var stmt1 =
        'INSERT INTO users (first_name ,last_name ,username , password) VALUES (?,?,?,?)';
      var data1 = [name, lastName, username, hash];
      conn.query(stmt1, data1, function (error, result) {
        if (error) throw error;
        res.redirect('/login');
      });
    });
  } else {
    res.render('createAccount', { error: true });
    console.log(passwordMatch);
  }
});

function compare(password1, password2) {
  if (password1 == password2) {
    return true;
  } else {
    return false;
  }
}

app.post('/login', async function (req, res) {
  let users = await userexist(req.body.username);
  let hashedPassword = users.length > 0 ? users[0].password : '';
  let passwordMatch = await checkPassword(req.body.password, hashedPassword);
  if (passwordMatch) {
    req.session.authenticated = true;
    req.session.user = req.body.username;

    let games = await getAllGames();
    res.render('index', { games: games });
  } else {
    res.render('login', { error: true });
  }

  console.log('username ' + req.body.username);
  console.log('password ' + req.body.password);
  console.log(users);
});

function userexist(username) {
  let stmt = 'SElECT * FROM users where username=?';
  return new Promise(function (resolve, reject) {
    conn.query(stmt, [username], function (error, results) {
      if (error) throw error;
      resolve(results);
    });
  });
}

function checkPassword(password, hash) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(password, hash, function (error, result) {
      if (error) throw error;
      resolve(result);
    });
  });
}

function isAuthenticated(req, res, next) {
  if (!req.session.authenticated) res.redirect('/login');
  else next();
}

function insertGame(body) {
  return new Promise(function (resolve, reject) {
      console.log('Connected!: insertGame');
      let sql = `INSERT INTO listings
                        (title, genre, image_url, price, seller_username)
                         VALUES ('${body.title}', '${body.genre}', '${body.imageURL}', ${body.price}, '${body.username}')`;
      conn.query(sql, function (err, rows, fields) {
        if (err) throw err;
        resolve(rows);
      });
    });
}

app.get('/cart', function (req, res) {
  res.render('cart');
});
/* The handler for undefined routes */
app.get('*', async function (req, res) {
  let games = await getAllGames();
});


app.post('/createAccount', async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let name = req.body.firstName;
  let lastName = req.body.lastName;
  let repeatPassword = req.body.repeatPassword;
  let salt = 10;

  let passwordMatch = await compare(password, repeatPassword);
  console.log('account created');
  if (passwordMatch) {
    bcrypt.hash(password, salt, function (error, hash) {
      if (error) throw error;
      var stmt =
        'INSERT INTO users (first_name ,last_name ,username , password) VALUES (?,?,?,?)';
      var data = [name, lastName, username, hash];
      conn.query(stmt, data, function (error, result) {
        if (error) throw error;
        res.redirect('/login');
      });
    });
  } else {
    res.render('createAccount', { error: true });
    console.log(passwordMatch);
  }
});

function compare(password1, password2) {
  if (password1 == password2) {
    return true;
  } else {
    return false;
  }
}

app.post('/login', async function (req, res) {
  let users = await userexist(req.body.username);
  let hashedPassword = users.length > 0 ? users[0].password : '';
  let passwordMatch = await checkPassword(req.body.password, hashedPassword);
  if (passwordMatch) {
    req.session.authenticated = true;
    req.session.user = req.body.username;

    let games = await getAllGames();
    res.render('index', { games: games });
  } else {
    res.render('login', { error: true });
  }

  console.log('username ' + req.body.username);
  console.log('password ' + req.body.password);
  console.log(users);
});

function userexist(username) {
  let stmt = 'SElECT * FROM users where username=?';
  return new Promise(function (resolve, reject) {
    conn.query(stmt, [username], function (error, results) {
      if (error) throw error;
      resolve(results);
    });
  });
}

function checkPassword(password, hash) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(password, hash, function (error, result) {
      if (error) throw error;
      resolve(result);
    });
  });
}
function isAuthenticated(req, res, next) {
  if (!req.session.authenticated) res.redirect('/login');
  else next();
}
