const { formatResponse } = require('../../util');
const {
  modelFields: { streamFields },
  models
} = require('../models');

const getAllStreams = (req, res, next) => {
  let { order = 'DESC' } = req.query;
  models.streams
    .findAll({
      order: [[streamFields.viewer_count, order]],
      limit: 100,
      raw: true
    })
    .then(streams => {
      res.send(formatResponse(200, streams, 'fetched all streams'));
    })
    .catch(err => {
      res.send(formatResponse(500, null, err));
    });
};

module.exports = {
  getAllStreams
};
