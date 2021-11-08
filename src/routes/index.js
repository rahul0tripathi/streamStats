const { statsRouter } = require('./stats');
const { authRouter } = require('./auth');
const express = require('express'),
  apiRouter = express.Router();
apiRouter.use('/api', statsRouter, authRouter);
module.exports = {
  apiRouter
};
