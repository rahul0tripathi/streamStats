const { streamFields, streams } = require('./streams'),
  { userFields, user } = require('./users');
module.exports = {
  models: {
    user,
    streams
  },
  modelFields: {
    userFields,
    streamFields
  }
};
