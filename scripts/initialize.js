require('dotenv').config({ path: './scripts/.env' });
require('dotenv').config();
const { default: axios } = require('axios');
const { database } = require('../config/database');
const { models, modelFields } = require('../src/models');
const { streamFields } = require('../src/models/streams');
const { Oauth } = require('../src/services/twitch');
const { persistToken, getToken } = require('../util');
let streams = [];
const MAX_RECORDS = process.env.MAX_RECORDS ? process.env.MAX_RECORDS : 50;
const helpers = {
  shuffle: arr => {
    for (let i = arr.length - 1; i >= 0; i--) {
      let random = Math.floor(Math.random() * i);
      [arr[i], arr[random]] = [arr[random], arr[i]];
    }
  }
};
var config = {
  method: 'get',
  url: 'https://api.twitch.tv/helix/streams?first=100',
  headers: {
    'Client-Id': process.env.TW_CLIENTID
  }
};
let cursor = null;
const newTokens = () => {
  return new Promise((resolve, reject) => {
    let token = getToken();
    if (!token) {
      token = process.env.TW_REFRESH_TOKEN;
    }
    Oauth.refreshToken(token)
      .then(authPayload => {
        console.log('Generated new tokens');
        if (authPayload?.data?.refresh_token) {
          persistToken(authPayload.data.refresh_token);
        }
        resolve(authPayload.data.access_token);
      })
      .catch(err => {
        reject(err);
      });
  });
};
const shuffleAndInsert = async () => {
  if (streams.length) {
    helpers.shuffle(streams);
    for (stream of streams) {
      if (stream[modelFields.streamFields.game_id]) {
        try {
          let _ = await models.streams.upsert({
            [modelFields.streamFields.id]: stream.id,
            [modelFields.streamFields.metadata]: stream.metadata,
            [modelFields.streamFields.user_id]: stream.user_id,
            [modelFields.streamFields.game_id]: stream.game_id,
            [modelFields.streamFields.viewer_count]: stream.viewer_count
          });
          console.log('created ', stream.id);
        } catch (err) {
          console.log('err creating', stream.id);
        }
      }
    }
    let count = await models.streams.count();
    if (count && count > MAX_RECORDS) {
      let deleteResponse = await database.query(`
    DELETE FROM stream_stats.streams ORDER BY viewer_count ASC LIMIT ${count - MAX_RECORDS};
    `);
      console.log(deleteResponse, 'deleted extra records');
    }
  }
};
const init = () => {
  console.log('initializing database');
  database.authenticate().then(() => {
    console.log('connected to database');
    database
      .sync({
        force: false
      })
      .then(async () => {
        process.env.TW_ACCESS_TOKEN = await newTokens();
        config.headers.Authorization = `Bearer ${process.env.TW_ACCESS_TOKEN}`;
        for (let i = 0; i < 11; i++) {
          try {
            if (cursor) {
              config.params = {
                after: cursor
              };
            }
            let data = await axios(config);
            if (data.data.data) {
              console.log(`fetched ${data.data.data.length} streams`);
              streams.push(
                ...data.data.data.map(v => {
                  return {
                    [streamFields.game_id]: v.game_id,
                    [streamFields.id]: v.id,
                    [streamFields.metadata]: v,
                    [streamFields.user_id]: v.user_id,
                    [streamFields.viewer_count]: v.viewer_count
                  };
                })
              );
            }

            if (data.data.pagination.cursor) {
              cursor = data.data.pagination.cursor;
            }
          } catch (error) {
            console.log(error);
          }
          if (i == 10) {
            console.log(`total streams ${streams.length}`);
            await shuffleAndInsert();
            break;
          }
        }
      });
  });
};
module.exports = {
  init
};
