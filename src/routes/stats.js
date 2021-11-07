const express = require('express'),
  stats = express.Router(),
  statsRouter = express.Router(),
  { getStatsByGames } = require('../controller/stats');

stats.get('/', getStatsByGames);

statsRouter.use('/stats', stats);
module.exports = {
  statsRouter
};
