const { formatResponse } = require('../../util');
const {
  modelFields: { streamFields },
  models
} = require('../models');
const helpers = {
  swap: (arr, indexA, indexB) => {
    [arr[indexA], arr[indexB]] = [arr[indexB], arr[indexA]];
  },
  findPartitionIndex: (array, start, end, key) => {
    let pivot = array[end][key];
    let partitionIndex = start;
    for (let i = start; i < end; i++) {
      if (array[i][key] < pivot) {
        helpers.swap(array, i, partitionIndex);
        partitionIndex++;
      }
    }
    helpers.swap(array, end, partitionIndex);
    return partitionIndex;
  },
  quickSortObjects: (array, start, end, key) => {
    if (start < end) {
      let partitionIndex = helpers.findPartitionIndex(array, start, end, key);
      helpers.quickSortObjects(array, partitionIndex + 1, end, key);
      helpers.quickSortObjects(array, start, partitionIndex - 1, key);
    }
  }
};

const getAllStreams = (req, res, next) => {
  let { order = 'DESC' } = req.query;
  models.streams
    .findAll({
      order: [[streamFields.viewer_count, 'DESC']],
      limit: 100,
      raw: true
    })
    .then(streams => {
      if (order == 'ASC') {
        helpers.quickSortObjects(streams, 0, streams.length - 1, streamFields.viewer_count);
      }
      res.send(formatResponse(200, streams, 'fetched all streams'));
    })
    .catch(err => {
      res.send(formatResponse(500, null, err));
    });
};

module.exports = {
  getAllStreams
};
