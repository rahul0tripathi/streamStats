const fs = require('fs');
const path = require('path');
const getModelAttributes = (model = {}) => {
  let description = { ...model };
  Object.keys(description).forEach(key => (description[key] = key));

  return description;
};
const formatAxiosError = ({ data: { status = 500, message = 'INTERNAL SERVER ERROR' } = {} }) => {
  return {
    code,
    message
  };
};
const formatResponse = (statusCode = 500, data = null, message = null) => {
  console.log(message);
  let response = { statusCode, result: {} };
  if (data) response.result.data = data;
  if (message) {
    if (typeof message === 'object' && message.name === 'SequelizeValidationError') {
      let errors = message.errors.map(ite => {
        return ite.message;
      });
      response.result.message = errors;
    } else if (typeof message === 'object' && message.name === 'SequelizeUniqueConstraintError') {
      response.result.message = ['Duplicate entry.', message.fields.unique_col];
    } else if (typeof message === 'object' && message.name === 'SequelizeDatabaseError') {
      response.result.message = ['Incorrect query.', message.sql];
    } else {
      response.result.message = message;
    }
  }
  return response;
};
const unpackRawQueryToObject = (values = []) => {
  let obj = {};
  for (let response of values) {
    try {
      response = response[0];
      obj = { ...response, ...obj };
    } catch (err) {}
  }
  return obj;
};
const persistToken = token => {
  fs.writeFileSync('/tmp/secret', token);
};
const getToken = () => {
  let token = fs.readFileSync('/tmp/secret');
  return token.toString();
};
module.exports = {
  getModelAttributes,
  formatAxiosError,
  formatResponse,
  unpackRawQueryToObject,
  getToken,
  persistToken
};
