'use strict'
const jwt = require('jsonwebtoken')
const config = require('./config')
const errors = require('./utils/errors')

function authToken () {
  return function (req, res, next) {
    const token = (req.query && req.query.access_token) || 
      (req.body && req.body.access_token) || 
      req.headers['x-access-token'] ||
      (req.cookies && req.cookies.access_token)

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

function signToken (obj, res) {
  const signedTok = jwt.sign(obj, config.session.secrets, {expiresIn: config.session.maxAge})
  if (res) {
    res.cookie('access_token', signedTok, { maxAge: config.session.maxAge })
  }
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

const levels = {
  'super': 0,
  'admin': 1,
  'reporter': 2,
  'customer': 3,
  'vistor': 4
}

function mapLevel(s) {
  if (!(s in levels)) return 100
  return levels[s]
}

function authLevel(level) {
  if (typeof level === 'string') {
    level = mapLevel(level)
  }
  return function (req, res, next) {
    if (typeof req.decoded_token.level !== 'number' || req.decoded_token.level > level) {
      throw errors.AuthError(`auth level need above ${level}`)
    }
    next()
  }
}

function isSuper(obj) {
  return obj.level === 0
}

function higherLevelThan(obj, level) {
  return typeof obj.level === 'number' && obj.level < level
}

module.exports = {
  authToken,
  authenticateRequird,
  signToken,
  authLevel,
  isSuper,
  mapLevel,
  higherLevelThan
}
