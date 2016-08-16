var Converter = require("csvtojson").Converter;
var converter = new Converter({constructResult:false});
var https = require('https');
var fs = require('fs');

var download = function(url,dest) {
  var fileDownload = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
  		response.pipe(fileDownload);
  	   });

    fileDownload.on('finish', function() {  	
      fileDownload.close();  // close() is async, call cb after close completes.
      converter.fromFile(dest,function(err,result){
      	result.pipe(fs.createWriteStream("./data/data.json"))
 	});
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

var run = function(){
  download("https://www.phoenix.gov/OpenDataFiles/Crime%20Stats.csv",'./data/data.json')
}

module.exports.run = run