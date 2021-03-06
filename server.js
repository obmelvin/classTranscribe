var fs = require('fs');
var util = require('util');
var http = require('http');
var path = require('path');
var express = require('express');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var SessionStore = require('express-mysql-session')
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var mysql = require('mysql');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var dbConfig = require('./db.js');

var app = express();
var sessionStore = new SessionStore(dbConfig.sessionStoreConfig);
var sessionSecret = '123sup3rs3cret'; //TODO: change to be actually secure

app.enable('trust proxy'); //this is necessary when using gulp as a proxy to enable livereload
//important to set static path before enabling sessions. otherwise initial requests for static resources will all
//try to start their own session
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  store: sessionStore,
  saveUninitialized: true,
  resave: true}));
app.use(passport.initialize());
app.use(passport.session());

var pool = mysql.createPool(dbConfig.config);
var mongoConnection = mongoose.createConnection(dbConfig.mongoURI, dbConfig.mongoConfig);
autoIncrement.initialize(mongoConnection);
mongoose.set('debug, true');
// Logging connection:
mongoConnection.on('error', console.error.bind(console, 'DB connection error.')).once('open', console.log.bind(console, 'DB Connection established.'));

var commentSchema = new mongoose.Schema({
  authorID  : Number,
  commentID : Number,
  parentID  : Number,
  video     : String,
  body      : String
});

commentSchema.plugin(autoIncrement.plugin, { model: 'Comment', field: 'commentID' });

var Comment = mongoConnection.model('Comment', commentSchema);

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

/*
 route handler for saving the first pass of transcriptions
*/
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

/*
 route handler for saving the second pass of transcriptions
 */
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

/*
 route handler going to annotations page
  eventually to match first and second pass url should be of the form 'annotations/:videoIndex'
*/
app.get('/annotations', function (req, res) {
  //if(req.user) {
    fs.readFile('annotations.html', function(err, file) {
      if(err)
        res.end(err);
      res.writeHead(200, {
        'Content-Type': 'text/html',
        "Access-Control-Allow-Origin" : "*",
        "Access-Control-Allow-Methods" : "POST, GET, PUT, DELETE, OPTIONS"
      });
      res.end(file.toString())
    });
  //}
});

/*
 API handler for adding an annotation
*/
app.put('/api/addAnnotation', function (req, res) {
  if(req.user.userType === 1) {
    addAnnotations(req.user.userID, req.body.video, req.body.time, req.body.content, function(err, results) {
      if(err) {
        res.writeHead(500);
        res.end(err.toString());
      } else {
        res.writeHead(204);
        res.end();
      }
    });
  } else {
    res.writeHead(507);
    res.end();
  }
});

/*
 query logic for adding an annotation to the database
 */
function addAnnotations(userID, video, time, content, cb) {
  pool.getConnection(function(connErr, conn) {
    var query = util.format("INSERT INTO annotations(id, userID, video, time, content) VALUES(NULL, '%d', %s, '%d', %s)",
        userID, conn.escape(video), conn.escape(parseInt(time)), conn.escape(content));
    conn.query(query, function(err, results, fields) {
      conn.release();
      cb(err, results);
    });
  });
}
exports.addAnnotations = addAnnotations;

/*
 route handler for suggesting a change to a transcription
*/
app.put('/api/suggestTranscriptChange', function (req, res) {
  //console.log("suggest session" + req.session);
  suggestTranscriptionChange(req.user.userID, req.body.video, req.body.time, req.body.suggestion, function(err, results) {
    if(err) {
      res.writeHead(500);
      res.end(err.toString());
    } else {
      res.writeHead(204);
      res.end();
    }
  })
});

/*
 DB logic for adding a suggested transcription change
*/
function suggestTranscriptionChange(userID, video, time, suggestion, cb) {
  pool.getConnection(function(connErr, conn) {
    var query = util.format("INSERT INTO transcriptionSuggestions(suggestionID, userID, video, time, suggestion) VALUES(NULL, '%d', %s, '%d', %s)",
        userID, conn.escape(video), conn.escape(parseInt(time)), conn.escape(suggestion));
    conn.query(query, function(err, results, fields) {
      conn.release();
      cb(err, results);
    });
  });
}
exports.suggestTranscriptionChange = suggestTranscriptionChange;

/*
 route handler for getting all suggested changes for a video
*/
app.get('/api/getSuggestedChanges', function (req, res) {
  getSuggestedChanges(req.query.video, function(err, results) {
    if(err) {
      res.writeHead(500);
      res.end(err.toString());
    } else {
      res.writeHead(200);
      res.end(JSON.stringify(results));
    }
  })
});

/*
 DB logic for getting all suggested changes for a particular video
*/
function getSuggestedChanges(videoName, cb) {
  pool.getConnection(function (connErr, conn) {
    var query = util.format("SELECT * FROM transcriptionSuggestions WHERE video=%s", conn.escape(videoName));
    conn.query(query, function(err, results, fields) {
      conn.release();
      cb(err, results);
    });
  })
}

/*
 route handler for voting on a suggested change to a transcription
*/
app.put('/api/submitSuggestionVote', function (req, res) {
  submitSuggestionVote(parseInt(req.body.suggestionID), req.user.userID, req.body.vote, function (err, results) {
    if(err) {
      res.writeHead(500);
      res.end(err.toString());
    } else {
      res.writeHead(204);
      res.end();
    }
  })
});

/*
 DB logic for storing a vote on a suggested change to a transcription
*/
function submitSuggestionVote(suggestionID, userID, vote, cb) {
  if(vote) {
    vote = 1;
  } else {
    vote = -1;
  }
  pool.getConnection(function(connErr, conn) {
    var query = util.format("INSERT INTO suggestionVotes(voteID, suggestionID, userID, vote) VALUES(NULL, '%d', %d, '%d')",
        conn.escape(suggestionID), userID, vote);
    conn.query(query, function(err, results, fields) {
      conn.release();
      cb(err, results);
    });
  });
}
exports.submitSuggestionVote = submitSuggestionVote;

/*
 route handler for loading annotations
*/
app.get('/api/loadAnnotations', function (req, res) {
  loadAnnotations(req.query.video, function (error, results) {
    if (error) {
      res.writeHead(500);
      res.end(error);
    } else {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(results));
    }
  });
});

/*
 logic for querying DB for annotations
*/
function loadAnnotations(videoName, cb) {
  pool.getConnection(function(connErr, conn) {
    var query = util.format("SELECT * FROM annotations WHERE video=%s", conn.escape(videoName));
    conn.query(query, function(err, results, fields) {
      conn.release();
      cb(err, results);
    })
  })
};
exports.loadAnnotations = loadAnnotations;

/*
 route handler getting all comments for a video
*/
app.get('/api/getComments', function (req, res) {
  loadComments(req.query.video, function (error, results) {
    if (error) {
      res.writeHead(500);
      res.end(error);
    } else {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(results));
    }
  })
});

/*
 DB logic for getting all comments for a video
*/
function loadComments(videoName, cb) {
  Comment.find({video: videoName, parentID: 0}, function(err, topComments) {
    topComments.forEach(function(current, index, array) {
      getCommentChildren(current, 0);
    });
    cb(err, topComments);
  });
  var fakeData = [
    {depth: 0, commentID: 1, userID: 2, commentText: 'hardcoded comment data'},
    {depth: 1, commentID: 2, userID: 2, commentText: 'more hardcoded comment data'}
  ];
}
exports.loadComments = loadComments;

/*
 helper query to recursively build comment tree
*/
function getCommentChildren(comment, depth) {
  var videoName = comment.video;
  var parentID = comment.commentID;
  Comment.find({video: videoName, parentID: parentID}, function(err, childComments) {
    if(childComments != null) {
      comment.childComments = childComments;
      childComments.forEach(function(current) {
        getCommentChildren(current, depth+1);
      })
    }
  });
}

/*
 route handler for submitting a comment on a video
*/
app.put('/api/submitComment', function (req, res) {
  submitComment(req.body.parentID, req.user.userID, req.body.video, req.body.commentText, function (error, results) {
    if(error) {
      res.writeHead(500);
      res.end(error.toString());
    } else {
      res.writeHead(204);
      res.end();
    }
  })
});

/*
 DB logic for submitting a comment on a video
 */
function submitComment(parentID, author, video, body, cb) {
  Comment.nextCount(function(err, count) {
    if (err) {
      console.error(err);
    }
    var comment = new Comment({
      authorID  : author,
      commentID : count,
      parentID  : parentID,
      video     : video,
      body      : body
    });
    comment.save(function(err, result) {
      if (err) {
        console.error(err);
      }
      cb(err, result);
    });
  });
}
exports.submitComment = submitComment;

/*
 route handler for logging in
*/
app.post('/login', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err) }
    //failed login currently just redirects to home page
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/')
    }
    req.logIn(user, function(err) {
      if (err)
        return next(err);
      var clientUser = JSON.parse(JSON.stringify(user));
      clientUser.password = null;
      res.end(JSON.stringify(clientUser));
    });
  })(req, res, next);
});

/*
 route handler for creating a new account
*/
app.post('/signup', function(req, res, next) {
  passport.authenticate('local-signup', function(err, user, info) {
    if (err) { return next(err) }
    //failed login currently just redirects to home page
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var clientUser = JSON.parse(JSON.stringify(user));
      clientUser.password = null;
      res.end(JSON.stringify(clientUser))
    });
  })(req, res, next);
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.
passport.serializeUser(function(user, done) {
  done(null, user.userID);
});

passport.deserializeUser(function(id, done) {
  pool.getConnection(function(dbErr, conn) {
    conn.query('select * from users where userID = ' + conn.escape(id), function (err, rows) {
      conn.release();
      done(err, rows[0]);
    });
  });
});

//local signup strategy for Passport
passport.use('local-signup', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      pool.getConnection(function(dbErr, conn) {
        conn.query('select * from users where email = ' + conn.escape(email), function (err, rows) {
          if (err) {
            conn.release();
            return done(err);
          }

          if (rows.length) { //email already in use
            conn.release();
            return done(null, false, {message: 'Email address already in use.'});
          } else {
            // if there is no user with that email then create a user
            var newUser = { email: email,
                            password: bcrypt.hashSync(password) }; // use the generateHash function in our user model
            var insertQuery = util.format('INSERT INTO users (email, password, userType) values (%s, %s, 0)',
                conn.escape(newUser.email), conn.escape(newUser.password));
            conn.query(insertQuery, function (err, rows) {
              conn.release();
              newUser.userID = rows.insertId;
              return done(null, newUser);
            });
          }
        });
      });
    }
));

//local login strategy for Passport
passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
      pool.getConnection(function (dbErr, conn) {
        conn.query('SELECT * FROM `users` WHERE `email` = ' + conn.escape(email), function (err, rows) {
          conn.release();
          if (err)
            return done(err);
          else if (!rows.length) //username doesn't exist
            return done(null, false, {message: 'Incorrect username.'});
          else if (!( bcrypt.compareSync(password, rows[0].password))) // if the user is found but the password is wrong
            return done(null, false, {message: 'Incorrect password.'});

          // all is well, return successful user
          return done(null, rows[0]);
        });
      });
    }
));

var server = app.listen(8000);

/*
 signal handlers to gracefully shutdown server
*/
process.on('SIGTERM', function() {
  server.close(function () {
    process.exit(0);
  })
});

process.on('SIGINT', function() {
  server.close(function () {
    process.exit(0);
  })
});