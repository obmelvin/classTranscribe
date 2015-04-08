var http = require('http');
var Router = require('node-simple-router');
var fs = require('fs');
var router = Router();

var indexHTML = fs.readFileSync('search.html').toString();
router.get('/', function (request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html'
  });
  fs.readFile('search.html', function(err, file) {
    response.end(file.toString());
  });
  //response.end(indexHTML);
});

var firstPassHTML = fs.readFileSync('index.html').toString();
router.get('/first/:videoIndex/:id', function (request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Methods" : "POST, GET, PUT, DELETE, OPTIONS"
  });
  response.end(firstPassHTML);
});

router.post('/first', function (request, response) {
  var stats = JSON.parse(request.post.stats);
  var transcriptions = JSON.parse(request.post.transcriptions);
  var captionFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  var statsFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  fs.writeFileSync("captions/first/" + captionFileName, request.post.transcriptions, {mode: 0777});
  fs.writeFileSync("stats/first/" + statsFileName, request.post.stats, {mode: 0777});
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify({success: true}));
});

router.post('/second', function (request, response) {
  var stats = JSON.parse(request.post.stats);
  var transcriptions = JSON.parse(request.post.transcriptions);
  var captionFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  var statsFileName = stats.video.replace(/\ /g,"_") + "-" + stats.name + ".json";
  fs.writeFileSync("captions/second/" + captionFileName, request.post.transcriptions, {mode: 0777});
  fs.writeFileSync("stats/second/" + statsFileName, request.post.stats, {mode: 0777});
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify({success: true}));
});

var secondPassHTML = fs.readFileSync('editor.html').toString();
router.get('/second/:videoIndex/:id', function (request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Methods" : "POST, GET, PUT, DELETE, OPTIONS"
  });
  response.end(secondPassHTML);
});

var server = http.createServer(router);
server.listen(8000);
