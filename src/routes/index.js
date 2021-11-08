const { statsRouter } = require('./stats');
const { authRouter } = require('./auth');
const { streamsRouter } = require('./streams');
const express = require('express'),
  apiRouter = express.Router();
apiRouter.use('/api', statsRouter, authRouter, streamsRouter);
module.exports = {
  apiRouter
};
