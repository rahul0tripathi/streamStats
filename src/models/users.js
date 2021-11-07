var Sequelize = require('sequelize');
const { database } = require('../../config/database');
const { getModelAttributes } = require('../../util');

const userModel = {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true
  },
  email: Sequelize.STRING,
  profile_image_url: Sequelize.STRING,
  user_name:Sequelize.STRING,
  secret_token: Sequelize.TEXT('long')
};
let userFields = { ...userModel };
userFields = getModelAttributes(userFields);
module.exports = {
  user: database.define('user', userModel),
  userFields
};
