var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGOLAB_URI //'mongodb://localhost:27017/crime-data';
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


NodeList.prototype.measureDeltas = function(latitude_range_obj, longitude_range_obj, time_range_obj) {
    var time_range = time_range_obj.max - time_range_obj.min;
    var latitude_range  = latitude_range_obj.max  - latitude_range_obj.min;
    var longitude_range  = longitude_range_obj.max  - longitude_range_obj.min;
    //var date_range  = date_range_obj.max  - date_range_obj.min;

    for (var i in this.nodes)
    {
        /* Just shortcut syntax */
        var incident = this.nodes[i];

        var delta_time = Math.abs(incident.time - this.queryNode.time);
        if (delta_time > 720) {
            delta_time = 1440 - delta_time;
        }

        delta_time = (delta_time ) / time_range;

        var delta_latitude  = incident.latitude - this.queryNode.latitude;
        delta_latitude = (delta_latitude ) / latitude_range;

        var delta_longitude  = incident.longitude - this.queryNode.longitude;
        delta_longitude = (delta_longitude ) / longitude_range;

        var delta_location = Math.sqrt(delta_latitude*delta_latitude + delta_longitude*delta_longitude);

        incident.delta = Math.sqrt( delta_time*delta_time + 10 * (delta_location*delta_location));
        //console.log(incident.type + ": " + delta_time + " " + delta_location + ", Crime Score: " + incident.delta);
    }
};
NodeList.prototype.sortByDelta = function() {
    this.nodes.sort(function (a, b) {
        return a.delta - b.delta;
    });
};
NodeList.prototype.guessType = function(k) {
    console.log(k + " crime incidents chosen due to proximity in time and location:")
    var types = [];
    var premises = [];
    //var info = {record:[], types: []};
    for (var i in this.nodes.slice(0, k))
    {
        var incident = this.nodes[i];
        //info.record[i] = incident;
        //console.log("Incident #" + i +": " + incident.type + ", " + incident.latitude + ", " + incident.longitude + ", " + showTime(incident.time));
        if ( ! types[incident.type] )
        {
            types[incident.type] = 0;
        }

        types[incident.type] += 1;

        if ( ! premises[incident.premise] )
        {
            premises[incident.premise] = 0;
        }

        premises[incident.premise] += 1;
    }

    var guess = {type: false, premise: 0};
    var typecount = 0;
    var premisecount = 0;
    for (var type in types)
    {
        if (types[type] > typecount)
        {
            guess.type = type;
            typecount = types[type];
        }
    }

    for (var premise in premises)   
    {
        if (premises[premise] > premisecount)
        {
            guess.premise = premise;
            premisecount = premises[premise];
        }
    }
    this.queryNode.guess = guess;
    //info.guess = guess;
    return guess;
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
    this.measureDeltas(this.latitude, this.longitude, this.time);

    /* Sort by deltas */
    this.sortByDelta();

    /* Guess type */
    var info = this.guessType(this.k);
    console.log(info);
    console.log("Most likely crime for this time & place: " + this.queryNode.guess.type + " at " + this.queryNode.guess.premise);
    return info;
};
NodeList.prototype.calculateRanges = function() {
    this.latitude = {min: 40, max: 30};
    this.longitude = {min: -110, max: -115};
    this.time = {min: 100000, max: 0};
    for (var i in this.nodes)
    {
        if (this.nodes[i].latitude < this.latitude.min)
        {
            this.latitude.min = this.nodes[i].latitude;
        }

        if (this.nodes[i].latitude > this.latitude.min)
        {
            this.latitude.max = this.nodes[i].latitude;
        }

        if (this.nodes[i].longitude < this.longitude.min)
        {
            this.longitude.min = this.nodes[i].longitude;
        }

        if (this.nodes[i].longitude > this.longitude.min)
        {
            this.longitude.max = this.nodes[i].longitude;
        }

        if (this.nodes[i].time < this.time.min)
        {
            this.time.min = this.nodes[i].time;
        }

        if (this.nodes[i].time > this.time.max)
        {
            this.time.max = this.nodes[i].time;
        }
    }

};


var nodes;
/*
function dateOfYear(month, date) {
    var dateNum = 0;
    switch (parseInt(month)) {
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
    dateNum += parseInt(date);
    return dateNum;
}
*/
function addNode(record) {
    //console.log(record.dateTime);
    try {
        var dateTime = record.dateTime.split(/\s+/);
        //var date = dateTime[0].split(/\//);
        //var crimeDate = dateOfYear(date[0],date[1]);
        var time = dateTime[1].split(/:/);
        var crimeTime = parseInt(time[0]*60) + parseInt(time[1]);
        //console.log(crimeDate + " " + crimeTime);
        nodes.add( new Node({time: crimeTime, latitude: record.latitude, longitude: record.longitude, type: record.crimeType, premise: record.premise}));
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
        db.collection("records").find({dateTime: {$ne: ""}, latitude: {$ne: ""}}).toArray(function(err, docs) {
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
        });

       });
    };

//var predict = function predict(arg, risk, callback) {
var predict = function predict(lat, lng, queryTime) {
    // Add user node
   nodes.queryNode = new Node({time: queryTime, latitude: lat, longitude: lng, type: false, premise: false});

    var guess = nodes.determineUnknown();
    nodes.queryNode = null;
    return guess;
};

module.exports.run = run;
module.exports.predict = predict;
