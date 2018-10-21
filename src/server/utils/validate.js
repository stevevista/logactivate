const Joi = require('joi')

function validate(obj, schema) {
  Joi.validate(obj, schema, {allowUnknown: true, convert: false}, (err, value) => { 
    if (err) {
      err.status = 400
      throw err
    }
  })
}

module.exports = {
  validate
}
