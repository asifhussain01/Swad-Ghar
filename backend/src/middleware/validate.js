const { sendError } = require('../utils/apiResponse');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ');
      return sendError(res, errorMessage, 400, error.details);
    }

    req[property] = value;
    next();
  };
};

module.exports = { validate };
