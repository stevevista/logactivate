'use strict'
const jwt = require('jsonwebtoken')
const compose = require('koa-compose')
const config = require('./config')

function authenticateRequird (required = true) {
  return async function (ctx, next) {
    const token = (ctx.query && ctx.query.access_token) || 
      (ctx.request.body && ctx.request.body.access_token) || 
      ctx.headers['x-access-token'] ||
      (ctx.cookies.get('access_token'))

    if (!token) {
      if (required) {
        ctx.throw(401, 'No authorization token was found')
      }
      await next()
      return
    }
    ctx.state._token = token
    ctx.state.decoded_token = await decodeToken(token, ctx.db)
    await next()
  }
}

function decodeToken(token, db) {
  const getKey = (header, callback) => {
    if (header.productKey && header.deviceName) {
      // console.log(header)
      db.Device.findOne({productKey: header.productKey, deviceName: header.deviceName})
        .then(r => {
          if (!r) {
            callback(new Error('wrong device'))
          } else {
            callback(null, r.deviceSecret)
          }
        })
    } else {
      const signingKey = config.session.secrets
      callback(null, signingKey)
    }
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, (err, decoded) => {
      if (err) reject(err)
      else resolve(decoded)
    })
  })
}

function signToken (obj, ctx, opt = {}) {
  const expiresIn = opt.maxAge || (config.session.maxAge / 1000)
  return new Promise((resolve, reject) => {
    jwt.sign(obj, config.session.secrets, {expiresIn}, (err, token) => {
      if (err) reject(err)
      else {
        if (ctx) {
          ctx.cookies.set('access_token', token, { maxAge: config.session.maxAge })
        }
        resolve(token)
      }
    })
  })
}

function signDevice (obj, {productKey, deviceName, deviceSecret}) {
  return jwt.sign(obj, deviceSecret, {
    header: {
      productKey,
      deviceName
    }
  })
}

const levels = {
  'super': 0,
  'admin': 1,
  'reporter': 2,
  'customer': 3,
  'visitor': 4
}

function mapLevel(s) {
  if (!(s in levels)) throw new Error(`unknown level ${s}`)
  return levels[s]
}

function _authLevel(level) {
  if (typeof level === 'string') {
    level = mapLevel(level)
  }
  return async function (ctx, next) {
    if (typeof ctx.state.decoded_token.level !== 'number' || ctx.state.decoded_token.level > level) {
      ctx.throw(401, `auth level need above ${level}`)
    }
    await next()
  }
}

function authLevel(level) {
  return compose([
    authenticateRequird(),
    _authLevel(level)
  ])
}

function isSuper(ctx) {
  return ctx.state.decoded_token && ctx.state.decoded_token.level === 0
}

function higherLevelThan(ctx, level) {
  return typeof ctx.state.decoded_token.level === 'number' && ctx.state.decoded_token.level < level
}

module.exports = {
  authenticateRequird,
  signToken,
  signDevice,
  decodeToken,
  authLevel,
  isSuper,
  mapLevel,
  higherLevelThan
}
