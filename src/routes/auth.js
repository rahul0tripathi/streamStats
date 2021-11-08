const express = require('express'),
  auth = express.Router(),
  authRouter = express.Router(),
  { handleOauthCallback } = require('../controller/auth');

auth.all('/', handleOauthCallback);

authRouter.use('/Oauth', auth);
module.exports = {
  authRouter
};
