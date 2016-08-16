var fs = require('fs');
var dburl = 'mongodb://localhost:27017/server';

// https://www.npmjs.com/package/mongodb
var MongoClient = require('mongodb').MongoClient;


var run = function() {
    var content = fs.readFileSync('./data/data.json'),
        json = JSON.parse(content);

    for (var i = 0; i < json.length; i++) {

        var timeStr = json[i]["startTime"],
            date = timeStr.substring(0, 10),
            time = timeStr.substring(timeStr.length - 5),
            timeNum = Number(time.substring(0, 2)) + Number(time.substring(time.length - 2)) / 60

        //take apart startTime to timeOfDay and Date
        json[i]["date"] = date;
        json[i]["timeOfDay"] = timeNum;
        // get rid of unwanted fields
        delete json[i]["endTime"];
        delete json[i]["startTime"];

    }
    // console.log(db.getCollectionNames());
    MongoClient.connect(dburl, function(err, db) {
        db.createCollection("test");
    })
}
module.exports.run = run