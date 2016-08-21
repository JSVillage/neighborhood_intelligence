var express = require('express');
var router = express.Router();
var precog = require('../data/precog');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Precog raw data */
router.get('/:postalCode', function(req, res, next) {
  
  res.send("Most likely crime for this time, date, and location is: " + precog.predict(req.params.postalCode));
});

module.exports = router;
