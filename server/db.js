var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyDXpveQ1ruB-lhck7G_HoLDp2E0S5VKYh0', // for Mapquest, OpenCage, Google Premier
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
var updateGeo = function(db, callback){
  
  setTimeout(function(){
    getGeo(db, function(){
      console.log('all done');
    });
    if(count < 50){ //50*50 = max calls per day
      count++;
      updateGeo(db);
    };
  }, 5000);
};

// Use connect method to connect to the Server 
MongoClient.connect(dburl, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  //console.log(db);
  
  // updateGeo(db);
  //console.log(db.collection('records'));

  // db.collection('records').find().count( 
  //   function(err, count){ 
  //   console.log(count);
  // });

  // db.collection('records').find([
  //   {$match: {loc: {$eq: null}}},
  //   {$limit: 10}    
  // ]).forEach(function(err, myDoc){
  //   console.log(myDoc);
  // });
  
});

var getConnection = function(){

};

var getNearby = function(arg, callback){
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    console.log(arg.lng);
    var query =  {
      loc : { 
        $near : [ parseFloat(arg.lng), parseFloat(arg.lat) ], 
        $maxDistance: arg.distance/111.12 
      }     
    };

    var collection = db.collection('records');

    collection.find(query,{},{ limit : 1000 }).toArray(function(err, docs){
      callback(docs);
      db.close();
    });

  });
  //callback([{"foo":"bar", "bat":"baz"}]);
  
};


module.exports.getNearby = getNearby;



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



