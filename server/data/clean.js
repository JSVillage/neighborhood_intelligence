var fs = require('fs');
var moment = require('moment');

var run = function() {
    var content = fs.readFileSync('./data/data.json'),
        today = moment(),
        weekBefore = today.subtract(7, "days"),
        json = JSON.parse(content),
        result = [];

    for (var i = 0; i < json.length; i++) {

        //filter out the records already exsists in database
        if (moment(json[i]["startTime"], "MM/DD/YYYY  HH:mm").isSameOrAfter(weekBefore, "day")) {

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

            result.push(json[i])
        }


    }

    console.log(result)

}
module.exports.run = run