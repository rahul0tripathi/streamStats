var cron = require('node-cron');
const { init } = require('../../scripts/initialize');
const { flushAll } = require('../controller/stats');
console.log("Scheduled job to update database")
cron.schedule('*/15 * * * *', () => {
  console.log('updating database');
  init();
  flushAll()
});
