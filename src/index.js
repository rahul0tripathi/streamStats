
require('dotenv').config();

const express = require('express'),
  app = express(),
  path = require('path'),
  { database } = require('../config/database'),
  {
    models: { user, streams }
  } = require('./models'),
  { default: axios } = require('axios');

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

//Connect and sync sequelize
database.authenticate().then(() => {
  console.log('Connected to database');
  database
    .sync({
      force: false
    })
    .then(async () => {
      console.log('synced database ');
    });
});
//start app
app.listen(3000, () => {
      console.log('started');
});
