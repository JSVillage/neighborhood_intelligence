var express = require('express');
var async = require('async');
var router = express.Router();
var api = require('../db');
var precog = require('../data/precog');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Neighborhood Intelligence API' });
});

router.get('/api/:lat/:lng/:distance?', function(req, res, next) {
  req.params.distance = req.params.distance || 1; //default 1 km

  api.getNearby(req.params, function(result){
    res.json(result);
  });
  
});

/* Precog raw data */
router.get('/:postalCode', function(req, res, next) {
  
  res.send("Most likely crime for this time, date, and location is: " + precog.predict(req.params.postalCode));
});

module.exports = router;
