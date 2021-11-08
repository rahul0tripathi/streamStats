const { verifyToken } = require('../controller/auth');
const express = require('express'),
  stats = express.Router(),
  statsRouter = express.Router(),
  { getStatsByGames } = require('../controller/stats');

stats.get('/', verifyToken, getStatsByGames);

statsRouter.use('/stats', stats);
module.exports = {
  statsRouter
};
