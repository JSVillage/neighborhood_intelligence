var express = require('express');
var async = require('async');
var router = express.Router();
var api = require('../db');
// var precog = require('../data/precog');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Neighborhood Intelligence API' });
});

router.get('/api/run-geo-update', function(req, res, next) {

  api.runGeoUpdate(req, function(){
    
  });

  res.render('index', { title: 'Geo update process running' });
  
});
/*
router.get('/api/:lat/:lng/stats', function(req, res, next) {
 //req.params.distance = req.params.distance || 1; //default 1 km
   console.log("Params are " + JSON.stringify(req.params));
//   if( isNaN(parseFloat(req.params.lat)) || isNaN(parseFloat(req.params.lng)) ){
//    res.status(400).json({"error":"Please provide a valid latitude and longitude"});
 //    return;
//   };

     api.getStats(req.params, function(result){
     res.json(result);
   });
  
});
*/
router.get('/api/:lat/:lng/:datetime?', function(req, res, next) {
  //req.params.distance = req.params.distance || 1; //default 1 km
  console.log("Params are " + JSON.stringify(req.params));
  if( isNaN(parseFloat(req.params.lat)) || isNaN(parseFloat(req.params.lng)) ){
    res.status(400).json({"error":"Please provide a valid latitude and longitude"});
    return;
  };

//   if (req.params.datetime !== undefined) {
//     var d = new Date(req.params.datetime);
//     if (d instanceof Date &&  !IsNaN(d.valueOf())) {
//       res.status(400).json({"error":"Please provide a valid date"});
//      return;
//     }
//   };

    api.getNearby(req.params, function(result){
    res.json(result);
  });
  
});


/* Precog raw data */
// router.get('/:postalCode', function(req, res, next) {
  
//   res.send("Most likely crime for this time, date, and location is: " + precog.predict(req.params.postalCode));
// });

module.exports = router;
