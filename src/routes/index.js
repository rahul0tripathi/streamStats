const { statsRouter } = require('./stats');
const express = require('express'),
  apiRouter = express.Router();
apiRouter.use('/api', statsRouter);
module.exports = {
  apiRouter
};
