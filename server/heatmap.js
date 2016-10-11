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

var crimeThreshold = function() {
  this.loc = loc;
  this.lowRiskScoreThreshold = 0;
  this.highRiskScoreThreshold = 0;
}
var pointHeatmap = [];

var buildHeatmap = function(db, callback){
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Building heatmap");

    var records = db.collection('records');
    var heatmap = db.collection('heatmap');
    var stats = db.collection('stats');

    // Find all crimes near here
    var dist = 0.01;

    // Start with clean collections
    heatmap.remove({});
    //stats.remove({});
    for (var lat = 33.4; lat <= 33.4; lat += 0.01) {
      for (var lng = -112.1; lng <= -112.099; lng += 0.01) {
        //for (var lat = 33.29; lat < 33.920; lat += 0.01) {
          //for (var lng = -112.33; lng < -111.92; lng += 0.01) {
          //var insertDB = false;
          for (var time = 0; time < 24; time++) {
            pointHeatmap[time] = {"loc":[lng,lat], "time":time, "score": 0, "crimeType": {}};
          }
          var query =  {
            loc : { $near : [ lng, lat ], $maxDistance: dist},
            dateTime: {$ne: ""}
          };
          records.find().limit(10).toArray(function(err, docs){
            console.log(lat + " " + lng + ": " + docs.length + " crimes");
            for (var doc in docs) {
              var dateTime = docs[doc].dateTime.split(/\s+/);
              var time = dateTime[1].split(/:/);
              var hour = parseInt(time[0]);

              // For now each crime in this circle is equal regardless of type or age
              pointHeatmap[hour].score++;
              if (!pointHeatmap[hour].crimeType[docs[doc].crimeType]) {
                pointHeatmap[hour].crimeType[docs[doc].crimeType] = 0;
              }
              pointHeatmap[hour].crimeType[docs[doc].crimeType] += 1;
              console.log(hour + ": " + pointHeatmap[hour].score + " " + docs[doc].crimeType + " " + pointHeatmap[hour].crimeType[docs[doc].crimeType]);
              //insertDB = true;
            }
          });
          //console.log("insertDB == true");
          console.log(pointHeatmap[0].score);
          try {
            for (var i = 0; i < 24; i++) {
              console.log(pointHeatmap[i]);
              var result = heatmap.insertOne(pointHeatmap[i]);
              console.log(result);
            }
            //heatmap.insertMany({result}).then(function(res) {
            //  console.log(res.insertedCount + " new records have been inserted into the database");
            //})
          } catch (e) {
            console.log(e);
          }
      }
    }
    // Compute stats for the whole city, store in another collection
    var count = heatmap.find().count();
    console.log("count = " + count);
    //if (count > 0)
    {
      var data =  heatmap.find().sort({"score": -1}).limit(1).toArray()[0];
      console.log(data);
      var thresholdStats = [];
      var lowRiskScoreThreshold = heatmap.find().sort( {"score": 1}).skip(count/3).limit(1).toArray()[0].score;
      var highRiskScoreThreshold = heatmap.find().sort( {"score": -1}).skip(count/3).limit(1).toArray()[0].score;
      var maxScore = heatmap.find().sort({"score": -1}).limit(1).toArray()[0].score;
      thresholdStats.push(new crimeThreshold([0,0], lowRiskScoreThreshold, highRiskScoreThreshold));
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
    //} else {
    //  console.log("Unable to create heatmap");
    }
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