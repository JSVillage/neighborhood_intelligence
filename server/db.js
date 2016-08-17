var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyBYWWimBkqZeGbqkpxgtKtgarznhew3wmg', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};


var dburl = 'mongodb://localhost:27017/server';
var geocoder = NodeGeocoder(options);


// https://www.npmjs.com/package/mongodb
var MongoClient = require('mongodb').MongoClient, 
    assert = require('assert');
 

//testing
var insertDocuments = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Insert some documents 
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
};
var updateDocument = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Update document where a is 2, set b equal to 1 
  collection.updateOne({ a : 2 }
    , { $set: { b : 1 } }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Updated the document with the field a equal to 2");
    callback(result);
  });  
}
var deleteDocument = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Insert some documents 
  collection.deleteOne({ a : 3 }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });
}
var findDocuments = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Find some documents 
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    assert.equal(2, docs.length);
    console.log("Found the following records");
    console.dir(docs);
    callback(docs);
  });
}
var deleteAllDocuments = function(db, callback) {
  db.collection('documents').remove();
  callback();
};
//end testing


// Standard account
// 2,500 free requests per day, calculated as the sum of client-side and server-side queries.
// 50 requests per second, calculated as the sum of client-side and server-side queries.
var getGeo = function(db, callback){
  var limit = 50;
  var count = 0;
  db.collection('locations').aggregate([
    {$match: {loc: {$eq: null}}},
    {$limit: limit}    
  ]).forEach(function(myDoc){
    var query = myDoc['100 BLOCK ADDR'].replace('XX', '00') + ' ARIZONA ' + myDoc.ZIP;
    geocoder.geocode(query)
      .then(function(res) {
        console.log(myDoc);
        console.log(res);
        
        db.collection('locations').update(
          { _id: myDoc._id },
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

  });  

};

var updateLocationsCollectionFromRecords = function(db, callback){
  //create a table with all of our distinct 100 BLOCK ADDR values
  db.collection('records').aggregate([
    //{$limit: 10},
    { $group: {
        _id: '$100 BLOCK ADDR',
        ZIP : {$first: '$ZIP'}
      }
    }
  ]).forEach(function(doc){
    db.collection('locations').insert(
      {'100 BLOCK ADDR' : doc._id, ZIP : doc.ZIP}
    );
  });
  callback();
};


var callGeo = function(db, callback){
  setTimeout(function(){
    getGeo(db, function(){
      console.log('all done');
    });
    callGeo(db);
  },5000);
};

// Use connect method to connect to the Server 
MongoClient.connect(dburl, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  // callGeo(db);

});











//shell commands
// db.locations.remove({})
// db.locations.find({ "loc": { $exists: false } }).count()
// https://docs.mongodb.com/manual/reference/mongo-shell/
// db.records.find().forEach(printjson)
// db.records.distinct('100 BLOCK ADDR')

// db.createCollection('locations')
// db.locations.createIndex({'100 BLOCK ADDR':1}, {unique: true})
// db.records.distinct('100 BLOCK ADDR').forEach(function(r){db.locations.insert({'100 BLOCK ADDR' : r})});

// mongoexport -d server -c locations -o /Users/dvespoli/Sites/neighborhood-intelligence/server/locations-export.json;
