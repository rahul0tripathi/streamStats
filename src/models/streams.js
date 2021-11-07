var Sequelize = require('sequelize');
const { database } = require('../../config/database');
const { getModelAttributes } = require('../../util');

const streamModel = {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true
  },
  game_id: Sequelize.STRING,
  user_id: Sequelize.STRING,
  viewer_count: Sequelize.BIGINT,
  game_name: {
    type: "VARCHAR(2000) GENERATED ALWAYS AS (json_unquote(json_extract(`metadata`,_utf8mb4'$.game_name'))) STORED",
    set() {
      throw new Error('failed to generate game_name');
    }
  },
  title: {
    type: "VARCHAR(2000) GENERATED ALWAYS AS (json_unquote(json_extract(`metadata`,_utf8mb4'$.title'))) STORED",
    set() {
      throw new Error('failed to generate title');
    }
  },
  metadata: Sequelize.JSON
};
let streamFields = { ...streamModel };
streamFields = getModelAttributes(streamFields);
module.exports = {
  streams: database.define('streams', streamModel),
  streamFields
};
