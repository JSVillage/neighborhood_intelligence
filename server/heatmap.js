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

    for (var lng = lng_min; lng <= lng_max; lng += delta) {
      for (var lat = lat_min; lat <= lat_max; lat += delta) {
        var pointHeatMap = {
          loc : [lng, lat],
          timedata : []
        };
        for (var hour = 0; hour < 24; hour++) {
          pointHeatMap.timedata[hour] = {"score": 0, "crimeType": {}};
        }
        pointsArray.push(pointHeatMap);
      }
    }
    console.log("lng_per_row = " + lng_per_row + ", lat_per_col = " + lat_per_col + ", pointsArray.length = " + lng_per_row * lat_per_col);
    records.find({dateTime: {$ne: ""}}).toArray(function(err, docs){
      for (var i = 0; i < docs.length; i++) {
        var dateTime = docs[i].dateTime.split(/\s+/);
        var time = dateTime[1].split(/:/);
        var hour = parseInt(time[0]);

        // For now each crime in this circle is equal regardless of type or age
        var lat_floor = Math.floor(docs[i].latitude * 100)/100;
        var lng_floor = Math.floor(docs[i].longitude * 100)/100;
        var idx = Math.round((lng_per_row * (lat_floor - lat_min)/delta) + (lng_floor - lng_min)/delta - 1);
        //console.log("lat: " + docs[i].latitude + ", lng: " + docs[i].longitude + ", lat_floor: " + lat_floor + ", lng_floor: " + lng_floor + ",  idx: " + idx);

        if (idx >= 0 && idx <= lng_per_row * lat_per_col - lng_per_row - 2) {
          addCrimeToHeatMap(idx, hour, docs[i].crimeType);
        }
      } //for doc in docs
num
      var pointsRemoved = 0;
      for (var i = pointsArray.length-1; i >= 0; i--) {
        var removePoint = true;
        for (var j = 0; j < 24; j++) {
          if (pointsArray[i].timedata[j]["score"] > 0) {
            removePoint = false;
            break;
          }
        }
        if (removePoint == true) {
          pointsArray.splice(i, 1);
          pointsRemoved++;
        }
      }
      console.log("Removed " + pointsRemoved + " empty points, remaining: " + pointsArray.length);
      heatmap.insertMany(pointsArray).then(function(res) {
        console.log(res.insertedCount + " new records have been inserted into the database");
        assert.equal(null, err);
        console.log("Calculating stats");
        var stats = db.collection('stats');
        stats.remove({});
        var num = res.insertedCount;
        // Compute stats for the whole city, store in another collection
        var statsArray = [];

        if (num > 0)
        {
          for (var i = 0; i < 24; i++) {
            statsArray[i].lowThreshold = heatmap.find().sort( {"timedata.i.score": 1}).skip(num/3).limit(1).toArray()["timedata"][i]["score"];
            statsArray[i].highThreshold = heatmap.find().sort( {"timedata.i.score": -1}).skip(num/3).limit(1).toArray()["timedata"][i]["score"];
            statsArray[i].maxScore = heatmap.find().sort( {"timedata.i.score": -1}).limit(1).toArray()["timedata"][i]["score"];
            console.log("Thresholds for time " +  i + ": low = " + statsArray[i].lowThreshold + ", high = " +
                          statsArray[i].highThreshold + ", max = " + statsArray[i].maxScore);
          }

          stats.insertMany(statsArray);
        } else {
          console.log("Unable to create stats collection");
        }
      });
    });
  });
};

function addCrimeToHeatMap(idx,hour,crimeType) {
  incScoreAndCrimeType(idx,hour,crimeType);
  incScoreAndCrimeType(idx+1,hour,crimeType);
  incScoreAndCrimeType(idx+lng_per_row,hour,crimeType);
  incScoreAndCrimeType(idx+lng_per_row+1,hour,crimeType);
}

function incScoreAndCrimeType(x,hour,crimeType){
  //console.log("Index " + x + " at time " + hour);
  pointsArray[x].timedata[hour]["score"]++;

  if (!pointsArray[x].timedata[hour]["crimeType"][crimeType]) {
    pointsArray[x].timedata[hour]["crimeType"][crimeType] = 0;
  }
  pointsArray[x].timedata[hour]["crimeType"][crimeType] += 1;

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
  geocoder.reverse({lat:arg.lat, lon:arg.lng}, function(err, res) {
    console.log(res);
    if(res.indexOf("Phoenix") === -1) {
      console.log("Not in Phoenix");
      callback("Error");
    }
  });

  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    var heatmap = db.collection('heatmap');
    var stats = db.collection('stats');

    // Compute data about this point
    var queryPoint =  {
      loc : [ parseFloat(arg.lng), parseFloat(arg.lat) ]  };
    heatmap.find(queryPoint).sort({"time": 1}).toArray(function(err, docs){
      var pointHeatmap = interpolateHeatmap(docs);

      // compare to thresholds
      var cityStat = stats.find({loc : [ 0, 0]}).limit(1).toArray()[0];
      var areaStat = stats.find({loc: [Math.floor(arg.lng*10)/10, Math.floor(arg.lng*10)/10]}).limit(1).toArray()[0];
      var info = {
        cityRisk:[],
        areaRisk: [],
        crimeGuess:[]
      };

      for (var i = 0; i < 24; i++) {
        // Compare location to the entire city
        if (pointHeatmap[i]["score"] < cityStat.lowRiskScoreThreshold)
          info.cityRisk[i] = "LOW";
        else if (pointHeatmap[i]["score"] < cityStat.highRiskScoreThreshold)
          info.cityRisk[i] = "MEDIUM";
        else
          info.cityRisk[i] = "HIGH";

        // Compare location to this area of the city
        if (pointHeatmap[i]["score"]< areaStat.lowRiskScoreThreshold)
          info.areaRisk[i] = "LOW";
        else if (pointHeatmap[i]["score"] < areaStat.highRiskScoreThreshold)
          info.areaRisk[i] = "MEDIUM";
        else
          info.areaRisk[i] = "HIGH";

        // Predict crime for each hour
        var maxX = Array.max(pointHeatmap[i]["crimeType"]);
        info.crimeGuess[i]  = pointHeatmap[i]["crimeType"].indexOf(maxX);
      }
      console.log(info);
      callback({heatmap: info});
      db.close();
    });
  });
 };
var interpolateHeatmap = function(docs) {
  return docs[0];
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
