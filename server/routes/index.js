var https = require('https');
var fs = require('fs');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  download("https://www.phoenix.gov/OpenDataFiles/Crime%20Stats.csv",'data.csv',function(){
  	console.log(arguments)
  })
  res.render('index', { title: 'Express' });
});

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

module.exports = router;
