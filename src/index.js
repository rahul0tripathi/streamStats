

require('dotenv').config();

const express = require('express'),
  app = express(),
  path = require('path'),
  { database } = require('../config/database'),
  {
    models: { user, streams }
  } = require('./models'),
  { default: axios } = require('axios');
  const { apiRouter } = require('./routes');
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.send({
    statusCode: 500,
    result: {
      message: 'Something went wrong'
    }
  });
});
app.use('/',apiRouter)
//Connect and sync sequelize
database.authenticate().then(() => {
  console.log('Connected to database');
  database
    .sync({
      force: false
    })
    .then(async () => {
      console.log('synced database ');
      require('../src/controller/stats');
      app.listen(3000, () => {
        console.log('started');
      });
    });
});
//start app
