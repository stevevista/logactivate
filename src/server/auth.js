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

function signToken (obj, req) {
  const token = jwt.sign(obj, config.session.secrets, {expiresIn: '3d'})
  if (req) {
    req.session.access_token = token
  }
  return token
}

function authenticateRequird () {
  return function (req, res, next) {
    if (!req.decoded_token) {
      const err = Error('No authorization token was found')
      err.status = 401
      throw err
    }
    next()
  }
}

function authLevel(level) {
  return function (req, res, next) {
    if (req.decoded_token.level > level) {
      const err = Error(`auth level need above ${level}`)
      err.status = 401
      throw err
    }
    next()
  }
}

module.exports = {
  authToken,
  authenticateRequird,
  signToken,
  authLevel
}
