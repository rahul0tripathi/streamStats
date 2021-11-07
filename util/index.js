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
module.exports = {
  getModelAttributes,
  formatAxiosError
};
