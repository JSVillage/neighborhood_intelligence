var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/server';
var assert = require('assert');

/*
 * Expected keys in object:
 * time of day, location, date of year, crime type
 */
var Node = function(object) {
    for (var key in object)
    {
        this[key] = object[key];
    }
};

var NodeList = function(k) {
    this.nodes = [];
    this.k = k;
};


NodeList.prototype.measureDeltas = function(location_range_obj, time_range_obj, date_range_obj) {
    var time_range = time_range_obj.max - time_range_obj.min;
    var location_range  = location_range_obj.max  - location_range_obj.min;
    var date_range  = date_range_obj.max  - date_range_obj.min;

    for (var i in this.nodes)
    {
        /* Just shortcut syntax */
        var incident = this.nodes[i];

        var delta_time = Math.abs(incident.time - this.queryNode.time);
        if (delta_time > 720) {
            delta_time = 1440 - delta_time;
        }

        delta_time = (delta_time ) / time_range;

        var delta_location  = incident.location  - this.queryNode.location;
        delta_location = (delta_location ) / location_range;

        var delta_date  = incident.date  - this.queryNode.date;
        delta_date = (delta_date ) / date_range;

        incident.delta = Math.sqrt( 5*delta_time*delta_time + 10000000 * delta_location*delta_location + delta_date * delta_date);
        //console.log(incident.type + ": " + delta_time + " " + delta_location + ", Crime Score: " + incident.delta);
    }
};
NodeList.prototype.sortByDelta = function() {
    this.nodes.sort(function (a, b) {
        return a.delta - b.delta;
    });
};
NodeList.prototype.guessType = function(k) {
    var types = {};
    console.log(k + " crime incidents chosen due to proximity in time and location:")

    for (var i in this.nodes.slice(0, k))
    {
        var incident = this.nodes[i];
        console.log("Incident #" + i +": " + incident.type + ", " + incident.location + ", " + showTime(incident.time) + ", " + incident.date);
        if ( ! types[incident.type] )
        {
            types[incident.type] = 0;
        }

        types[incident.type] += 1;
    }

    var guess = {type: false, count: 0};
    for (var type in types)
    {
        if (types[type] > guess.count)
        {
            guess.type = type;
            guess.count = types[type];
        }
    }

    this.queryNode.guess = guess;

    return types;
};



NodeList.prototype.add = function(node) {
    this.nodes.push(node);
};

NodeList.prototype.determineUnknown = function() {

    this.calculateRanges();

    /*
     * If the node is an unknown type, clone the nodes list and then measure locations.
     */
    
    /* Measure deltas */
    this.measureDeltas(this.location, this.time, this.date);

    /* Sort by deltas */
    this.sortByDelta();

    /* Guess type */
    console.log(this.guessType(this.k));
    console.log("Most likely crime for this time & place: " + this.queryNode.guess.type);
    return this.queryNode.guess.type;
};
NodeList.prototype.calculateRanges = function() {
    this.location = {min: 100000, max: 0};
    this.time = {min: 100000, max: 0};
    this.date = {min: 360, max: 0};
    for (var i in this.nodes)
    {
        if (this.nodes[i].time < this.time.min)
        {
            this.time.min = this.nodes[i].time;
        }

        if (this.nodes[i].time > this.time.max)
        {
            this.time.max = this.nodes[i].time;
        }

         if (this.nodes[i].location < this.location.min)
        {
            this.location.min = this.nodes[i].location;
        }

        if (this.nodes[i].location > this.location.max)
        {
            this.location.max = this.nodes[i].location;
        }
        if (this.nodes[i].date < this.date.min)
        {
            this.date.min = this.nodes[i].date;
        }

        if (this.nodes[i].date > this.date.max)
        {
            this.date.max = this.nodes[i].date;
        }
    }

};


var nodes;

function dateOfYear(date) {
    var dateNum = 0;
    switch (parseInt(date[0])) {
        case 1: dateNum = 0; break;
        case 2: dateNum = 31; break;
        case 3: dateNum = 59; break;
        case 4: dateNum = 90; break;
        case 5: dateNum = 120; break;
        case 6: dateNum = 151; break;
        case 7: dateNum = 181; break;
        case 8: dateNum = 212; break;
        case 9: dateNum = 243; break;
        case 10: dateNum = 273; break;
        case 11: dateNum = 304; break;
        case 12: dateNum = 334; break;
    }
    dateNum += parseInt(date[1]);
    return dateNum;
}

function addNode(record) {
    //console.log(record.dateTime);
    try {
        var dateTime = record.dateTime.split(/\s+/);
        var date = dateTime[0].split(/\//);
        var crimeDate = dateOfYear(date);
        var time = dateTime[1].split(/:/);
        var crimeTime = parseInt(time[0]*60) + parseInt(time[1]);
        var crimeLocation = record.postalCode;
        nodes.add( new Node({date: crimeDate, time: crimeTime, location: crimeLocation, type: record.crimeType}));
    }
    catch (e) {
        console.log("Error importing record for: " + record);
        //console.log("Error for: " + record.crimeTime + " " + record.dateTime + " " + record.postalCode);
        //console.log("Error. Date: " + record.dateTime + " is day " + crimeDate + " and time " + crimeTime );
    }
}  

function showTime(t) {
    return ('0' + Math.floor(t/60)).slice(-2) + ":" + ('0' + t%60).slice(-2);
}


var run = function() {
    console.log("Connecting to Mongo");
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        db.collection("info").find({dateTime: {$ne: ""}, postalCode: {$lte: 85099, $gte: 85001}}).toArray(function(err, docs) {
        assert.equal(err, null);
        db.close();

        nodes = new NodeList(11);
        // add data nodes

        for (var i = 0; i < docs.length; i++) {
            //console.log(docs[i]);
        	addNode(docs[i]);
        }
        console.log(nodes.nodes.length + " records ready to generate reports");
        console.log();
        console.log("Press any key to generate report for random user (x = exit)");
        const readline = require('readline');
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str,key) => {
            if (str == 'x')
                process.exit();
            predict();
            console.log();
            console.log("Press any key to generate report for random user (x = exit)");
        });

       });
    });
};

var predict = function predict(location, time, date) {
    // Add user node
    var queryLocation = location || Math.floor( Math.random() * 98 ) + 85001;
    var queryTime;
    var queryDate;
    var currentDate = new Date();
    if (time) {
        queryTime = time;
    } else {
        queryTime = currentDate.getHours() * 60 + currentDate.getMinutes();
    }
    if (date) {
        queryDate = date;
    } else {
        queryDate = currentDate.getMonth() * 30 + currentDate.getDate();
    }
    console.log("User is querying from zip code " + queryLocation + " at time " + showTime(queryTime) + " and date of year " + queryDate);
    nodes.queryNode = new Node({date: queryDate, time: queryTime, location: queryLocation, type: false});

    var prediction = nodes.determineUnknown();
    nodes.queryNode = null;
    return prediction;
};
module.exports.run = run;
module.exports.predict = predict;