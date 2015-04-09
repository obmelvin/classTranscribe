var fs = require('fs');
var http = require('http');
var path = require('path');
var express = require('express');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var mysql = require('mysql');

var app = express();
var SALT_WORK_FACTOR = 10;
var sessionSecret = '123sup3rs3cret'; //TODO: change to be actually secure

app.enable('trust proxy'); //this is necessary when using gulp as a proxy to enable livereload
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: sessionSecret, saveUninitialized: true, resave: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

var dbConn = mysql.createConnection({
  host     : 'engr-cpanel-mysql.engr.illinois.edu',
  database : 'omelvin2_classTranscribe',
  user     : 'omelvin2_dev',
  password : 'secret',
  connectTimeout: 1000000
});

function User(id, username, email, password) {
  this.id = id;
  this.username = username;
  this.email = email;
  this.password = password;
}

var user = new User(1, 'oliver', 'obmelvin@gmail.com', 'secret');

//var indexHTML = fs.readFileSync('search.html').toString();
app.get('/', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  fs.readFile('search.html', function(err, file) {
    res.end(file.toString());
  });
  //res.end(indexHTML);
});

var firstPassHTML = fs.readFileSync('index.html').toString();
//url should be of form '/first/:videoIndex/:id'
app.get('/first/*/*', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Methods" : "POST, GET, PUT, DELETE, OPTIONS"
  });
  res.end(firstPassHTML);
});

app.post('/first', function (req, res) {
  var stats = JSON.parse(req.post.stats);
  var transcriptions = JSON.parse(req.post.transcriptions);
  var captionFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  var statsFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  fs.writeFileSync("captions/first/" + captionFileName, req.post.transcriptions, {mode: 0777});
  fs.writeFileSync("stats/first/" + statsFileName, req.post.stats, {mode: 0777});
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({success: true}));
});

app.post('/second', function (req, res) {
  var stats = JSON.parse(req.post.stats);
  var transcriptions = JSON.parse(req.post.transcriptions);
  var captionFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  var statsFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  fs.writeFileSync("captions/second/" + captionFileName, req.post.transcriptions, {mode: 0777});
  fs.writeFileSync("stats/second/" + statsFileName, req.post.stats, {mode: 0777});
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({success: true}));
});

var secondPassHTML = fs.readFileSync('editor.html').toString();
//url should be of form 'second/:videoIndex/:id'
app.get('/second/*/*', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Methods" : "POST, GET, PUT, DELETE, OPTIONS"
  });
  res.end(secondPassHTML);
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err) }
    //failed login currently just redirects to home page
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.userID);
});

passport.deserializeUser(function(id, done) {
  dbConn.query('select * from users where userID = ' + dbConn.escape(id), function (err, rows) {
    done(err, rows[0]);
  });
});

passport.use('local-signup', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      dbConn.query('select * from users where email = ' + dbConn.escape(email), function(err, rows) {
        console.log(rows);
        console.log("above row object");
        if (err)
          return done(err);
        if (rows.length) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        } else {
          // if there is no user with that email
          // create the user
          var newUserMysql = new Object();

          newUserMysql.email    = email;
          newUserMysql.password = password; // use the generateHash function in our user model

          var insertQuery = 'INSERT INTO users ( email, password, userType ) values (' + dbConn.escape(email)
              +','+ dbConn.escape(password) +')';
          console.log(insertQuery);
          dbConn.query(insertQuery,function(err,rows){
            newUserMysql.id = rows.insertId;

            return done(null, newUserMysql);
          });
        }
      });
    }));

passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

      dbConn.query('SELECT * FROM `users` WHERE `email` = ' + dbConn.escape(email),function(err,rows){
        if (err)
          return done(err);
        if (!rows.length) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        // if the user is found but the password is wrong
        if (!( rows[0].password == password))
          return done(null, false, { message: 'Incorrect password.' });

        // all is well, return successful user
        return done(null, rows[0]);

      });



    }));

var server = app.listen(8000);
