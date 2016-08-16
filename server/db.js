var dburl = 'mongodb://localhost:27017/server';


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

// Use connect method to connect to the Server 
MongoClient.connect(dburl, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  
  var schematodo = db.collection('records').findOne().then(function(foo){
    console.log(foo);
  });
  

  // for (var key in schematodo) { console.log (key, typeof key) ; }
  // deleteAllDocuments(db, function(){
  //   console.log('Bam...its all gone!');
  // });
  // deleteDocument(db, function() {

  // };
  // findDocuments(db, function() {
  //   db.close();
  // });
  // insertDocuments(db, function() {
  //   updateDocument(db, function() {
  //     deleteDocument(db, function() {
  //       findDocuments(db, function() {
  //         db.close();
  //       });
  //     });
  //   });
  // });
});

//shell commands
// https://docs.mongodb.com/manual/reference/mongo-shell/
// db.records.find().forEach(printjson)
// db.records.distinct('100 BLOCK ADDR')

// db.createCollection('locations')
// db.locations.createIndex({'100 BLOCK ADDR':1}, {unique: true})
// db.records.distinct('100 BLOCK ADDR').forEach(function(r){db.locations.insert({'100 BLOCK ADDR' : r})});
