var precog = require('./data/precog');
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyAwkxTe-EXtfrahmP8L0fdPGH83tDP9jkg', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var dburl = 'mongodb://localhost:27017/crime-data';
var geocoder = NodeGeocoder(options);

// https://www.npmjs.com/package/mongodb
var MongoClient = require('mongodb').MongoClient, 
    assert = require('assert');

var getGeo = function(db, callback){
  var limit = 50; //50 per second
  var count = 0;

  var query =  {loc: {$eq: null}};
  
  var collection = db.collection('records');
  var cursor = collection.find(query).limit(limit);

  cursor.each(function(err, doc){

    if (doc) {
      var query = doc['address'].replace('XX', '00') + ' ARIZONA ' + doc.postalCode;
      geocoder.geocode(query)
        .then(function(res) {
          console.log(doc);
          console.log(res);
          
          collection.update(
            { _id: doc._id },
            {
              $set : {
                latitude : res[0].latitude,
                longitude : res[0].longitude,
                formattedAddress : res[0].formattedAddress,
                loc : [ res[0].longitude, res[0].latitude ],
                extra : res[0].extra
              }
            });
          return true;
        })
        .catch(function(err) {
          console.log(err);
          return err;
        });    

    } else {
      console.log('no doc');
    }    

  });  

};

// Standard account
// 2,500 free requests per day, calculated as the sum of client-side and server-side queries.
// 50 requests per second, calculated as the sum of client-side and server-side queries.
var count = 0;
var runGeoUpdate = function(db, callback){
  
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Running geo update");
  
    setTimeout(function(){
      getGeo(db, function(){
        console.log('all done');
      });
      if(count < 50){ //50*50 = max calls per day
        count++;
        runGeoUpdate(db);
      };
    }, 5000);

  });

  
};

// Use connect method to connect to the Server 
// MongoClient.connect(dburl, function(err, db) {
//   assert.equal(null, err);
//   console.log("Connected correctly to server");
//   //console.log(db);
  
//   // updateGeo(db);
//   //console.log(db.collection('records'));

//   // db.collection('records').find().count( 
//   //   function(err, count){ 
//   //   console.log(count);
//   // });

//   // db.collection('records').find([
//   //   {$match: {loc: {$eq: null}}},
//   //   {$limit: 10}    
//   // ]).forEach(function(err, myDoc){
//   //   console.log(myDoc);
//   // });
  
// });

var getNearby = function(arg, callback){
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    //console.log("Connected correctly to server");
    var date;
    if (arg.datetime !== undefined) {
      date = new Date(arg.datetime);
      console.log(date);
    } else {
      date = new Date();
      console.log(date);
    }
    date.setUTCHours(date.getUTCHours()-7);
    var queryTime = date.getHours() * 60 + date.getMinutes();
    
    var query =  {
      loc : { $near : [ parseFloat(arg.lng), parseFloat(arg.lat) ], $maxDistance: 0.0044996},
      dateTime: {$ne: ""}
    };

    var collection = db.collection('records');

    collection.find(query,{},{}).toArray(function(err, docs){
      var count = 0;
      var info = {risk: [], guess: [], timeOfDay: [0,0,0,0,0,0], dayOfWeek: [0,0,0,0,0,0,0], types: {}};
      //console.log("Current time: " + queryTime + ", Nearby records = " + docs.length);
      for (var doc in docs) {
        var dateTime = docs[doc].dateTime.split(/\s+/);
        var date = dateTime[0].split(/\//);
        var day = new Date((date[2]) + "-" + date[0] + "-" + date[1]);
        var day = new Date(dateTime[0]);

        var time = dateTime[1].split(/:/);
        var crimeTime = parseInt(time[0]*60) + parseInt(time[1]);
        if (crimeTime > queryTime - 60 && crimeTime < queryTime + 60)
            count++;
        info.timeOfDay[parseInt(crimeTime/240)]++;
        info.dayOfWeek[day.getUTCDay()]++;
        if ( ! info.types[docs[doc].crimeType] )
        {
            info.types[docs[doc].crimeType] = 0;
        }
        info.types[docs[doc].crimeType] += 1;

      }
      if (count > 6) {
        info.risk = "HIGH";
      } else if (count > 3) {
        info.risk = "MEDIUM";
      } else {
        info.risk = "LOW";
      }
      console.log(count + " out of " + docs.length +" crimes occured at " + arg.lat + "," + arg.lng + " within an hour of " + queryTime);
      info.guess = precog.predict(arg.lat, arg.lng, queryTime);
      console.log(info)
      callback({precog: info});
    
      db.close();
    });

  });
  
};
/*
var getStats = function(arg, callback){
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
   
    var query =  {
      loc : { 
        $near : [ parseFloat(arg.lng), parseFloat(arg.lat) ], 
        $maxDistance: 0.0044996
      },
      dateTime: {$ne: ""}
    };

    var collection = db.collection('records');

    collection.find(query,{},{}).toArray(function(err, docs){
      var stats = {timeOfDay: [0,0,0,0,0,0], dayOfWeek: [0,0,0,0,0,0,0], types: {}};
      for (var doc in docs) {
        console.log(docs[doc]);
        var dateTime = docs[doc].dateTime.split(/\s+/);
        var date = dateTime[0].split(/\//);
        var day = new Date((date[2]) + "-" + date[0] + "-" + date[1]);
        var time = dateTime[1].split(/:/);
        var crimeTime = parseInt(time[0]*60) + parseInt(time[1]);
        stats.timeOfDay[parseInt(crimeTime/240)]++;
        stats.dayOfWeek[day.getDay()]++;

        if ( ! stats.types[docs[doc].crimeType] )
        {
            stats.types[docs[doc].crimeType] = 0;
        }
        stats.types[docs[doc].crimeType] += 1;
        console.log(docs[doc].crimeType + " " + stats.types[docs[doc].crimeType]);

        // console.log(stats)
     
      }
      console.log(stats);
      callback({stats: stats});
      db.close();
    });

  });
  
};
*/

module.exports.getNearby = getNearby;
module.exports.runGeoUpdate = runGeoUpdate;



//https://neighborhood-intelligence.tailw.ag/api/33.5862677/-111.9769553/

//shell commands
// db.locations.remove({})
// db.locations.find({ "loc": { $exists: false } }).count()
// https://docs.mongodb.com/manual/reference/mongo-shell/
// db.records.find().forEach(printjson)
// db.records.distinct('address')

//great geo index on loc
//db.records.ensureIndex({"loc" : "2d"})

// db.createCollection('locations')
// db.locations.createIndex({'100 BLOCK ADDR':1}, {unique: true})
// db.records.distinct('100 BLOCK ADDR').forEach(function(r){db.locations.insert({'100 BLOCK ADDR' : r})});

// terminal
// mongoexport -d crime-data -c locations -o /Users/dvespoli/Sites/neighborhood-intelligence/server/locations-export.json;
// mongoimport --db crime-data --collection records --drop --jsonArray --file /opt/webserver/data/data.json



