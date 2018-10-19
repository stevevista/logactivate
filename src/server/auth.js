const jwt = require('jsonwebtoken')
const config = require('./config')

function authToken () {
  return function (req, res, next) {
    const token = (req.query && req.query.access_token) || 
      (req.body && req.body.access_token) || 
      req.headers['x-access-token'] ||
      (req.session && req.session.access_token)

    if (!token) {
      return next()
    }
    jwt.verify(token, config.session.secrets, (err, decoded) => {
      if (err) throw err
      req.decoded_token = decoded
      next()
    })
  }
}

function signToken (obj) {
  return jwt.sign(obj, config.session.secrets, {expiresIn: '1y'})
}

function authenticateRequird () {
  return function (req, res, next) {
    if (!req.decoded_token) {
      throw Error('No authorization token was found')
    }
    next()
  }
}

module.exports = {
  authToken,
  authenticateRequird,
  signToken
}
