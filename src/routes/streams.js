const { verifyToken } = require('../controller/auth');
const express = require('express'),
  streams = express.Router(),
  streamsRouter = express.Router(),
  { getAllStreams } = require('../controller/streams');
streams.get('/', getAllStreams);
streamsRouter.use('/streams', verifyToken, streams);
module.exports = {
  streamsRouter
};
