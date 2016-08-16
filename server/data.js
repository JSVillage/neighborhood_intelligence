var fetch = require('./data/fetch');

var cron = function() {
    fetch.getData();
    //parse.run();
}
module.exports.cron = cron