const Joi = require('joi')

function validate(obj, schema) {
  const {err, value} = Joi.validate(obj, schema, {allowUnknown: true, convert: true})
  if (err) {
    err.status = 400
    throw err
  }
  return value
}

module.exports = {
  validate
}
