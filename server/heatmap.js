var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyAwkxTe-EXtfrahmP8L0fdPGH83tDP9jkg', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

// var dburl = 'mongodb://localhost:27017/crime-data';
var dburl = 'mongodb://heroku_66scqnxq:cgumfgro1nqv0tqmbbahdj1l79@ds019966.mlab.com:19966/heroku_66scqnxq';
var geocoder = NodeGeocoder(options);
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

var crimeThreshold = function(object) {
  for (var key in object)
  {
      this[key] = object[key];
  }
};

const lat_min = 33.29;
const lat_max = 33.92;
const lng_min = -112.33;
const lng_max = -111.92;
const delta = 0.01;
const lng_per_row = Math.round((lng_max - lng_min)/delta);
const lat_per_col = Math.round((lat_max - lat_min)/delta);
const matrix_points = lng_per_row * lat_per_col;

var pointsArray = [];

var buildHeatmap = function(db, callback){
  pointsArray = [];
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Building heatmap");

    var records = db.collection('records');
    var heatmap = db.collection('heatmap');

    // Find all crimes near here
    var dist = 0.01;

    // Start with clean collections
    heatmap.remove({});

    for (var lat = 0; lat < lat_per_col; lat++) {
      for (var lng = 0; lng < lng_per_row; lng++) {
        for (var hour = 0; hour < 24; hour++) {
          var pointHeatMap = {
            loc : [lng_min + lng*delta, lat_min + lat*delta],
            time: hour,
            score: 0,
            crimeType: {}
          };
          pointsArray.push(pointHeatMap);
        }
      }
    }

    console.log("lng_per_row = " + lng_per_row + ", lat_per_col = " + lat_per_col + ", matrix points = " + matrix_points);
    records.find({dateTime: {$ne: ""}}).toArray(function(err, docs){
      for (var i = 0; i < docs.length; i++) {
        var dateTime = docs[i].dateTime.split(/\s+/);
        var time = dateTime[1].split(/:/);
        var hour = parseInt(time[0]);

        // For now each crime in this circle is equal regardless of type or age
        var lat_floor = Math.floor(docs[i].latitude * 100)/100;
        var lng_floor = Math.floor(docs[i].longitude * 100)/100;
        var idx = Math.round((lng_per_row * (lat_floor - lat_min)/delta) + (lng_floor - lng_min)/delta);
        //console.log("lat: " + docs[i].latitude + ", lng: " + docs[i].longitude + ", lat_floor: " + lat_floor + ", lng_floor: " + lng_floor + ",  idx: " + idx);

        if (idx >= 0 && idx <= lng_per_row * lat_per_col - lng_per_row - 2) {
          addCrimeToHeatMap(idx, hour, docs[i].crimeType);
        }
      } //for docs
      var pointsRemoved = 0;
      for (var i = matrix_points - 1; i >= 0; i--) {
        var removePoint = true;
        var idxArray = i * 24; // index constant for each point
        var idxPoint = idxArray; // index checks all hours for each point
        for (var j = 0; j < 24; j++) {
          if (pointsArray[idxPoint++]["score"] > 0) {
            removePoint = false;
            break;
          }
        }
        if (removePoint == true) {
          pointsArray.splice(idxArray, 24);
          pointsRemoved++;
        }
      }
      console.log("Removed " + pointsRemoved + " empty points, remaining points: " + pointsArray.length/24);
      heatmap.insertMany(pointsArray).then(function(res) {
        console.log(res.insertedCount + " new records have been inserted into the database");
        assert.equal(null, err);
        console.log("Calculating stats");
        var stats = db.collection('stats');
        stats.remove({});
        var num = res.insertedCount;
        // Compute stats for the whole city, store in another collection
        var statsObject = {};

        if (num > 0) {
          heatmap.find().sort( {"score": -1}).limit(1).toArray(function(err,docs){
            statsObject.maxScore = docs[0]["score"];
            statsObject.highThreshold = statsObject.maxScore/10;
            statsObject.lowThreshold = statsObject.maxScore/30;

            stats.insertOne(statsObject);
          });
        } else {
          console.log("Unable to create stats collection");
        }
      });
    });
  });
};

/*            heatmap.find().sort( {"score": 1}).skip(Math.round(num/3)).limit(1).toArray(function(err, docs){
              statsObject.lowThreshold = docs[0]["score"];
              heatmap.find().sort( {"score": -1}).skip(Math.round(num/3)).limit(1).toArray(function(err, docs){
                statsObject.highThreshold = docs[0]["score"];
                  console.log("Thresholds: low = " + statsObject.lowThreshold + ", high = " +
                          statsObject.highThreshold + ", max = " + statsObject.maxScore);
                        });
                      });

*/

function addCrimeToHeatMap(idx,hour,crimeType) {
  incScoreAndCrimeType(idx,hour,crimeType);
  incScoreAndCrimeType(idx+1,hour,crimeType);
  incScoreAndCrimeType(idx+lng_per_row,hour,crimeType);
  incScoreAndCrimeType(idx+lng_per_row+1,hour,crimeType);
}

function incScoreAndCrimeType(x,hour,crimeType){
  //console.log("Index " + x + " at time " + hour);
  var y = x*24+hour;
  pointsArray[y]["score"]++;

  if (!pointsArray[y]["crimeType"][crimeType]) {
    pointsArray[y]["crimeType"][crimeType] = 0;
  }
  pointsArray[y]["crimeType"][crimeType] += 1;

  //console.log("score = " + pointsArray[x].timedata[hour]["score"] +
  //  ", crimeType " + crimeType + " = " + pointsArray[x].timedata[hour]["crimeType"][crimeType]);
}
/*
var calcStats = function(db, count){
  assert.equal(null, err);
  console.log("Calculating stats");
  var heatmap = db.collection('heatmap');
  var stats = db.collection('stats');
  stats.remove({});
  // Compute stats for the whole city, store in another collection
  var statsArray = [];

  if (count > 0)
  {
    for (var i = 0; i < 24; i++) {
      statsArray[i].lowThreshold = heatmap.find().sort( {"timedata.i.score": 1}).skip(count/3).limit(1).toArray()["timedata"][i]["score"];
      statsArray[i].highThreshold = heatmap.find().sort( {"timedata.i.score": -1}).skip(count/3).limit(1).toArray()["timedata"][i]["score"];
      statsArray[i].maxScore = heatmap.find().sort( {"timedata.i.score": -1}).limit(1).toArray()["timedata"][i]["score"];
      console.log("Thresholds for time " +  i + ": low = " + statsArray[i].lowThreshold + ", high = " + statsArray[i].highThreshold + ", max = " + statsArray[i].maxScore);
    }

    stats.insertMany(statsArray);
  } else {
    console.log("Unable to create stats collection");
  }
}
*/
var calcData = function(arg, callback){
  // Check if we are in Phoenix
/*
  geocoder.reverse({lat:arg.lat, lon:arg.lng}, function(err, res) {
    console.log(res);
    if(res.indexOf("Phoenix") === -1) {
      console.log("Not in Phoenix");
      callback("Error");
    }
  });
*/
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    var heatmap = db.collection('heatmap');
    var stats = db.collection('stats');

    // Compute data about this point
    //var query =  {loc : { $near : [ parseFloat(arg.lng), parseFloat(arg.lat) ], $maxDistance: 0.02 }};
    //console.log(query);
    var lnglo = parseFloat(arg.lng) - (2 * delta);
    var lnghi = parseFloat(arg.lng) + (2 * delta);
    var latlo = parseFloat(arg.lat) - (2 * delta);
    var lathi = parseFloat(arg.lat) + (2 * delta);
    var queryPoint =  {"loc.0" : {$gt: lnglo, $lt: lnghi}, "loc.1" : {$gt: latlo, $lt: lathi}};
    console.log(queryPoint);
    heatmap.find(queryPoint,{},{}).toArray(function(err, docs){
      //var pointHeatmap = interpolateHeatmap(docs);
      var info = {time: [], timeOfDay: [0,0,0,0,0,0], types: {}};
      for (var i = 0; i < 24; i++){
        info.time[i] = {risk: "LOW", guess: "NONE"};
      }
      if (docs === undefined || docs.length == 0){
        // no crimes reported nearby
        console.log("No crimes reported nearby");
        console.log(info);
        callback({heatmap: info});
      } else {
        console.log(docs.length + " records accessed within 0.1 for risk assessment");
        // compare to thresholds
        stats.find().toArray(function(err,crimeStats){
          //var areaStat = stats.find({loc: [Math.floor(arg.lng*10)/10, Math.floor(arg.lng*10)/10]}).limit(1).toArray()[0];

          var crimeScoreArray = [];
          var crimeTypeArray = [];

          for (var i = 0; i < 24; i++){
            crimeScoreArray[i] = 0;
            crimeTypeArray[i] = {};
          }
          for (var i = 0; i < docs.length; i++) {
            // add to score
            crimeScoreArray[docs[i].time] += docs[i].score;
            info.timeOfDay[docs[i].time/4] += docs[i].score;

            // add to crime type
            for (var inst in docs[i].crimeType){
              if ( crimeTypeArray[docs[i].time][inst] === undefined )
              {
                  crimeTypeArray[docs[i].time][inst] = 0;
              }
              crimeTypeArray[docs[i].time][inst] += docs[i].crimeType[inst];
            }
          }
          for (var i = 0; i < 24; i++){
            // compute risk based on score
            if (crimeScoreArray[i] < crimeStats[0].lowThreshold * docs.length/24)
              info.time[i].risk = "LOW";
            else if (crimeScoreArray[i]  < crimeStats[0].highThreshold * docs.length/24)
              info.time[i].risk = "MEDIUM";
            else
              info.time[i].risk = "HIGH";

            // compute guess based on crimeType weighting
            var max = 0;
            for (var inst in crimeTypeArray[i]){
              if (crimeTypeArray[i][inst] > max) {
                max = crimeTypeArray[i][inst];
                info.time[i].guess = inst;
              }
              if ( info.types[inst] === undefined )
              {
                  info.types[inst] = 0;
              }
              info.types[inst] += crimeTypeArray[i][inst];
            }

            if (info.time[i].guess === undefined) {
              info.time[i].guess = "NONE";
            }
          }
          console.log(info);
          callback({precog: info});
        });
      }
    });
  });
};


/*
function generateHeatMapFusion(){
  for (var lat = lat_min; lat < lat_max; lat += delta*5) {
    for (var lng = lng_min; lng < lng_max; lng += delta*5) {
      var query = { "loc.0": {$gte: lng, $lt: lng+delta*5}, "loc.1": {$gte: lat, $lt: lat+delta*5}};
      count = heatmap.find(query).count();
      lowRiskScoreThreshold = heatmap.find(query).sort({"score": 1}).skip(count/3).limit(1).toArray()[0].score;
      highRiskScoreThreshold = heatmap.find(query).sort({"score": -1}).skip(count/3).limit(1).toArray()[0].score;
      thresholdStats.push(new crimeThreshold({"loc": [lng,lat], "lowThreshold": lowRiskScoreThreshold, "highThreshold": highRiskScoreThreshold}));
      maxScore = heatmap.find(query).sort({"score": -1}).limit(1).toArray()[0].score;
    }
  }
  //console.log("Area threshold (" + lat + "," + lng + "): low = " + lowRiskScoreThreshold + ", high = " + highRiskScoreThreshold + ", max = " + maxScore);
}
*/

module.exports.buildHeatmap = buildHeatmap;
module.exports.calcData = calcData;
//module.exports.calcStats = calcStats;
