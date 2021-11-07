const Sequelize = require('sequelize');
const database = new Sequelize(process.env.DB_SCHEMA, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  logging: console.log,
  sync: {
    force: false
  },
  freezeTableName: true,
  pool: {
    max: 20,
    min: 10,
    acquire: 6000,
    idle: 1000
  }
});

module.exports = {
  database
};
