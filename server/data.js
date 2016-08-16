var fetch = require('./data/fetch');
var parse = require('./data/parse');

var cron = function(){
	fetch.run();
	//parse.run();
}
module.exports.cron = cron