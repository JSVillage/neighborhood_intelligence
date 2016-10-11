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


var heatinfo = function(loc, time) {
  // score is array of values for each hour
  this.loc = loc;
  this.time = time;
  this.score = 0;
  this.crimeType = {};
  //this.dayOfWeek = [];
}

var crimeThreshold = function() {
  this.loc = loc;
  this.lowRiskScoreThreshold = 0;
  this.highRiskScoreThreshold = 0;
}

var buildHeatmap = function(db, callback){
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Building heatmap");

    var records = db.collection('records');
    var heatmap = db.collection('heatmap');
    var stats = db.collection('stats');

    var dist = 0.01 * Math.Pi / 180;
    var heatlist = [];

    // Start with clean collections
    heatmap.remove({});
    stats.remove({});
    for (var lat = 33.29; lat < 33.920; lat += 0.01) {
      for (var lng = -112.33; lng < -111.92; lng += 0.01) {
          var result = [];
          for (var time = 0; time < 24; time++) {
            result.push(new heatinfo([lng,lat], time));
          }
          var query =  {
            loc : { $near : [ parseFloat(lng), parseFloat(lat) ], $maxDistance: dist},
            dateTime: {$ne: ""}
          };
          var cursor = records.find(query);
          cursor.each(function(err, doc){
            if (doc) {
              var dateTime = doc.dateTime.split(/\s+/);
              var time = dateTime[1].split(/:/);
              var hour = parseInt(time[0]);
              // For now each crime in this circle is equal regardless of type or age
              result[hour].score++;
              result[hour].crimeType[doc.crimeType]++;
            } else {
              console.log('no doc');
            }
          });
          heatmap.insertMany(result);
      }
    }
    // Compute stats for the whole city, store in another collection
    var count = heatmap.count();
    var thresholdStats = [];
    var lowRiskScoreThreshold = heatmap.find().sort( {"score": 1}).skip(count/3).limit(1).toArray()[0].score;
    var highRiskScoreThreshold = heatmap.find().sort( {"score": -1}).skip(count/3).limit(1).toArray()[0].score;
    thresholdStats.push(new crimeThreshold([0,0], lowRiskScoreThreshold, highRiskScoreThreshold));
    var maxScore = heatmap.find(query).sort({"score": -1}).limit(1).toArray()[0].score;
    console.log("City thresholds: low = " + lowRiskScoreThreshold + ", high = " + highRiskScoreThreshold + ", max = " + maxScore);

    for (var lat = 33.29; lat < 33.920; lat += 0.05) {
      for (var lng = -112.33; lng < -111.92; lng += 0.05) {
        var query = { "loc.0": {$gte: lng, $lt: lng+0.05}, "loc.1": {$gte: lat, $lt: lat+0.05}};
        count = heatmap.find(query).count();
        lowRiskScoreThreshold = heatmap.find(query).sort({"score": 1}).skip(count/3).limit(1).toArray()[0].score;
        highRiskScoreThreshold = heatmap.find(query).sort({"score": -1}).skip(count/3).limit(1).toArray()[0].score;
        thresholdStats.push(new crimeThreshold([lng,lat], lowRiskScoreThreshold, highRiskScoreThreshold));
        maxScore = heatmap.find(query).sort({"score": -1}).limit(1).toArray()[0].score;
      }
    }
    console.log("Area threshold (" + lat + "," + lng + "): low = " + lowRiskScoreThreshold + ", high = " + highRiskScoreThreshold + ", max = " + maxScore);
    stats.insertMany(thresholdStats);
  });
};

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
        if (pointHeatmap[i].score < cityStat.lowRiskScoreThreshold)
          info.cityRisk[i] = "LOW";
        else if (pointHeatmap[i].score < cityStat.highRiskScoreThreshold)
          info.cityRisk[i] = "MEDIUM";
        else
          info.cityRisk[i] = "HIGH";

        // Compare location to this area of the city
        if (pointHeatmap[i].score < areaStat.lowRiskScoreThreshold)
          info.areaRisk[i] = "LOW";
        else if (pointHeatmap[i].score < areaStat.highRiskScoreThreshold)
          info.areaRisk[i] = "MEDIUM";
        else
          info.areaRisk[i] = "HIGH";

        // Predict crime for each hour
        var maxX = Array.max(pointHeatmap[i].crimeType);
        info.crimeGuess[i]  = pointHeatmap[i].crimeType.indexOf(maxX);
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

module.exports.buildHeatmap = buildHeatmap;
module.exports.calcData = calcData;
