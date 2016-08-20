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

Node.prototype.measureDeltas = function(location_range_obj, time_range_obj, date_range_obj) {
    var time_range = time_range_obj.max - time_range_obj.min;
    var location_range  = location_range_obj.max  - location_range_obj.min;
    var date_range  = date_range_obj.max  - date_range_obj.min;

    for (var i in this.incidents)
    {
        /* Just shortcut syntax */
        var incident = this.incidents[i];

        var delta_time = Math.abs(incident.time - this.time);
        if (delta_time > 720) {
            delta_time = 1440 - delta_time;
        }

        delta_time = (delta_time ) / time_range;

        var delta_location  = incident.location  - this.location;
        delta_location = (delta_location ) / location_range;

        var delta_date  = incident.date  - this.date;
        delta_date = (delta_date ) / date_range;

        incident.delta = Math.sqrt( 5*delta_time*delta_time + 10000000 * delta_location*delta_location + delta_date * delta_date);
        //console.log(incident.type + ": " + delta_time + " " + delta_location + ", Crime Score: " + incident.delta);
    }
};
Node.prototype.sortByDelta = function() {
    this.incidents.sort(function (a, b) {
        return a.delta - b.delta;
    });
};
Node.prototype.guessType = function(k) {
    var types = {};
    console.log(k + " crime incidents chosen due to proximity in time and location:")

    for (var i in this.incidents.slice(0, k))
    {
        var incident = this.incidents[i];
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

    this.guess = guess;

    return types;
};



var NodeList = function(k) {
    this.nodes = [];
    this.k = k;
};

NodeList.prototype.add = function(node) {
    this.nodes.push(node);
};

NodeList.prototype.determineUnknown = function() {

    this.calculateRanges();

    /*
     * Loop through our nodes and look for unknown types.
     */
    for (var i in this.nodes)
    {

        if ( ! this.nodes[i].type)
        {
            /*
             * If the node is an unknown type, clone the nodes list and then measure locations.
             */
            
            /* Clone nodes */
            this.nodes[i].incidents = [];
            for (var j in this.nodes)
            {
                if ( ! this.nodes[j].type)
                    continue;
                this.nodes[i].incidents.push( new Node(this.nodes[j]) );
            }

            /* Measure deltas */
            this.nodes[i].measureDeltas(this.location, this.time, this.date);

            /* Sort by deltas */
            this.nodes[i].sortByDelta();

            /* Guess type */
            console.log(this.nodes[i].guessType(this.k));
            console.log("Most likely crime for this time & place: " + this.nodes[i].guess.type);

        }
    }
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

function addNode(record) {
    //console.log(record.dateTime);
    try {
        var dateTime = record.dateTime.split(/\s+/);
        var date = dateTime[0].split(/\//);
        var crimeDate = parseInt(date[0])*30 + parseInt(date[1]);
        var time = dateTime[1].split(/:/);
        var crimeTime = parseInt(time[0]*60) + parseInt(time[1]);
        var crimeLocation = record.postalCode;
        nodes.add( new Node({date: crimeDate, time: crimeTime, location: crimeLocation, type: record.crimeType}));
    }
    catch (e) {
        //console.log("Error for: " + record.crimeTime + " " + record.dateTime + " " + record.postalCode);
    }
}  

function showTime(t) {
    return ('0' + Math.floor(t/60)).slice(-2) + ":" + ('0' + t%60).slice(-2);
}

var run = function() {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        db.collection("info").find({dateTime: {$ne: null}, postalCode: {$lte: 85099, $gte: 85001}}).toArray(function(err, docs) {
        assert.equal(err, null);
        db.close();

        nodes = new NodeList(11);
        // add data nodes

        for (var i = 0; i < docs.length; i++) {
            //console.log(docs[i]);
        	addNode(docs[i]);
        }
        

        // Add user node
        var queryTime = Math.floor( Math.random() * 1440 );
        var queryDate = Math.floor( Math.random() * 360);
        var queryLocation = Math.floor( Math.random() * 98 ) + 85001;
        console.log("User is querying from zip code " + queryLocation + " at time " + showTime(queryTime) + " and date of year " + queryDate);
        nodes.add( new Node({date: queryDate, time: queryTime, location: queryLocation, type: false}));
        nodes.determineUnknown();
       });
    });
};

module.exports.run = run;