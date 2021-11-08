const { default: axios } = require('axios');
const { formatAxiosError } = require('../../util');
const Oauth = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/',
  timeout: 5000
});
const verifyOauth = ({ code = null }) => {
  return new Promise((resolve, reject) => {
    if (code) {
      Oauth.post('/token', null, {
        params: {
          client_id: process.env.TW_CLIENTID,
          client_secret: process.env.TW_CLIENTSECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.TW_REDIRECT_URI
        }
      })
        .then(tokenResponse => {
          if (tokenResponse.data?.access_token) {
            Oauth.get('/validate', {
              headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
              }
            })
              .then(validateReponse => {
                if (validateReponse.data) {
                  resolve({ validateReponse: validateReponse.data, tokenResponse: tokenResponse.data });
                }
              })
              .catch(err => {
                reject(formatAxiosError(err));
              });
          } else {
            reject(
              formatAxiosError({
                data: {
                  status: 401,
                  message: 'INVALID PAYLOAD'
                }
              })
            );
          }
        })
        .catch(err => {
          console.log(err);
          reject(formatAxiosError(err));
        });
    } else {
      reject(
        formatAxiosError({
          data: {
            status: 500,
            message: 'INVALID CODE'
          }
        })
      );
    }
  });
};
const refreshToken = refreshToken => {
  return Oauth.post('/token', null, {
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.TW_CLIENTID,
      client_secret: process.env.TW_CLIENTSECRET
    }
  });
};
const twitchClient = axios.create({
  baseURL: 'https://api.twitch.tv/helix/',
  timeout: 5000,
  headers: {
    'Client-Id': process.env.TW_CLIENTID
  }
});
const getUserDetails = ({ id, authToken }) => {
  return new Promise((resolve, reject) => {
    twitchClient
      .get('/users', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      .then(response => {
        if (response.data) {
          resolve(response.data);
        }
      })
      .catch(err => {
        reject(err.data);
      });
  });
};
module.exports = {
  Oauth: {
    client: Oauth,
    verify: verifyOauth,
    refreshToken
  }
};
