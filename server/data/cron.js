var fetch = require('./fetch');
var cronjob = require('cron').CronJob;

//runs on every day 17:00 pm
var job = new cronjob('00 00 17 * * *', function() {
    fetch.getData();
}, null, true);

module.exports.job = job