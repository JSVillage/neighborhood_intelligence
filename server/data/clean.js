var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = process.env.MONGOLAB_URI; //'mongodb://localhost:27017/server';

var run = function() {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        db.collection("records").findOne({ $query: {}, $orderby: { dateTime: -1 } }, function(err, r) {
            var latestTime = r["dateTime"];
            cleanAndInsert(latestTime, db);
        });
    });
}


var cleanAndInsert = function(latestTime, db) {

    var content = fs.readFileSync('./data/data.json'),
        json = JSON.parse(content),
        result = [];

    for (var i = 0; i < json.length; i++) {

        //filter out the records already exsist in database
        var diff = new Date(json[i]["dateTime"]) - latestTime;
        if (diff > 0) {

            var timeStr = json[i]["dateTime"],
                date = timeStr.substring(0, 10),
                time = timeStr.substring(timeStr.length - 5),
                timeNum = Number(time.substring(0, 2)) + Number(time.substring(time.length - 2)) / 60;

            //take apart startTime to timeOfDay and Date
            json[i]["date"] = date;
            json[i]["timeOfDay"] = timeNum;
            json[i]["dateTime"] = new Date(timeStr);

            // get rid of unwanted fields
            delete json[i]["endTime"];

            result.push(json[i])
        }

    }
    db.collection("records").insertMany(result).then(function(res) {
        console.log(res.insertedCount + " new records have been inserted into the database")
    });

}
module.exports.run = run