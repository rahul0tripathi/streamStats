const { models, modelFields } = require('../models');
const SIGNATURE = 'IsImtpZCI6IjEifQ.eyJhdWQiOiJuNm51YXplYjFq';
const jwt = require('jsonwebtoken');
const { Oauth } = require('../services/twitch');
const upsertUser = ({ user_id, user_name, profile_pic }) => {
  return models.user.upsert({
    [modelFields.userFields.id]: user_id,
    [modelFields.userFields.user_name]: user_name
  });
};
const signNewJWT = user_id => {
  return jwt.sign(
    {
      user_id
    },
    SIGNATURE,
    {
      expiresIn: 60 * 60
    }
  );
};
const handleOauthCallback = (req, res, next) => {
  try {
    Oauth.verify({ code: req.query.code })
      .then(authResponse => {
        if (authResponse?.validateReponse) {
          upsertUser({ user_id: authResponse.validateReponse.user_id, user_name: authResponse.validateReponse.login })
            .then(() => {
              res.render('Oauth', {
                status: 200,
                user_info: {
                  user_name: authResponse.validateReponse.login
                },
                token: signNewJWT(authResponse.validateReponse.user_id),
                err: null
              });
            })
            .catch(err => {
              console.error(err);
              res.render('Oauth', {
                status: 500,
                user_info: {},
                token: null,
                err: 'something went wrong (ERR:CREATE_USER)'
              });
            });
        }
      })
      .catch(err => {
        res.render('Oauth', {
          status: 500,
          user_info: {},
          token: null,
          err: 'invalid payload (ERR:OAUTH_ERR)'
        });
      });
  } catch (err) {
    console.log(err);
  }
};
const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, SIGNATURE, (err, parsedData) => {
      if (err) {
        res.sendStatus(401);
      } else {
        req.session = parsedData;
        next();
      }
    });
  } else {
    res.sendStatus(401);
  }
};
module.exports = {
  handleOauthCallback,
  verifyToken
};
