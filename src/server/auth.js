const jwt = require('jsonwebtoken')
const config = require('./config')

function authToken (credentialsRequired) {
  return function (req, res, next) {
    const token = (req.query && req.query.access_token) || 
      (req.body && req.body.access_token) || 
      req.headers['x-access-token'] ||
      (req.session && req.session.access_token)

    if (!token) {
      if (credentialsRequired) {
        throw Error('No authorization token was found')
      }
      return next()
    }
    jwt.verify(token, config.session.secrets, (err, decoded) => {
      if (err) throw err
      req.decoded_token = decoded
      next()
    })
  }
}

function signToken (id) {
  return jwt.sign({_id: id}, config.session.secrets, {expiresIn: '1y'})
}

function isAuthenticated (credentialsRequired) {
  return authToken(credentialsRequired)
}

module.exports = {
  isAuthenticated,
  signToken
}
