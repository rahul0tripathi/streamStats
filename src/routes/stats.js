const { verifyToken } = require('../controller/auth');
const express = require('express'),
  stats = express.Router(),
  statsRouter = express.Router(),
  { getStatsByGames } = require('../controller/stats');
stats.get('/', getStatsByGames);
statsRouter.use('/stats', verifyToken, stats);
module.exports = {
  statsRouter
};
