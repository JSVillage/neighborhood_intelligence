var express = require('express');
var async = require('async');
var router = express.Router();
var api = require('../db');
var hm = require('../heatmap');
// var precog = require('../data/precog');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Neighborhood Intelligence API' });
});

router.get('/api/run-geo-update', function(req, res, next) {
  api.runGeoUpdate(req, function(){});
  res.render('index', { title: 'Geo update process running' });
});

router.get('/api/:lat/:lng/:datetime?', function(req, res, next) {
  //req.params.distance = req.params.distance || 1; //default 1 km
  console.log("Params are " + JSON.stringify(req.params));
  if( isNaN(parseFloat(req.params.lat)) || isNaN(parseFloat(req.params.lng)) ){
    res.status(400).json({"error":"Please provide a valid latitude and longitude"});
    return;
  };

  console.log('about to call nearby');
  api.getNearby(req.params, function(result){
    res.json(result);
  });

});


// Work with heatmap
router.get('/hm/build', function(req, res, next) {
  hm.buildHeatmap(req, function(){});
  res.render('index', { title: 'Build Heatmap' });
});
/*
// Calc stats
router.get('/hm/stats', function(req, res, next) {
  hm.calcStats(req, function(){});
  res.render('index', { title: 'Calc Stats' });
});
*/
router.get('/hm/:lat/:lng', function(req, res, next) {
  console.log("Heatmap calcData Params are " + JSON.stringify(req.params));
  if( isNaN(parseFloat(req.params.lat)) || isNaN(parseFloat(req.params.lng)) ){
    res.status(400).json({"error":"Please provide a valid latitude and longitude"});
    return;
  };

  console.log('about to call calcData');
  hm.calcData(req.params, function(result){
    res.json(result);
  });

});

module.exports = router;
