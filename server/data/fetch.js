var Converter = require("csvtojson").Converter;
var converter = new Converter({
    constructResult: false,
    workerNum: 2,
    toArrayString: true,
    headers: ["caseId", "startTime", "endTime", "type", "address", "zip", "premise"]
});
var https = require('https');
var fs = require('fs');

var clean = require('./clean');

var getData = function() {
    var fileDownload = fs.createWriteStream("./data/data.csv");
    var request = https.get("https://www.phoenix.gov/OpenDataFiles/Crime%20Stats.csv", function(response) {
        response.pipe(fileDownload);
    });

    fileDownload.on('finish', function() {
        var readStream = fs.createReadStream("./data/data.csv");
        var writeStream = fs.createWriteStream("./data/data.json");

        fileDownload.close(function() {
            readStream.pipe(converter).pipe(writeStream).on("finish", function() {
                clean.run();
            });
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
    });
};


module.exports.getData = getData;