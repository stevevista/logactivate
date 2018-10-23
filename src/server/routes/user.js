'use strict'
const Router = require('express-promise-router')
const {authenticateRequird, signToken} = require('../auth')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const config = require('../config')

const router = Router()

router.get('/auth', authenticateRequird(), (req, res) => {
  res.json({
    username: req.decoded_token.username,
    level: req.decoded_token.level
  })
})

router.post('/auth', (req, res) => {
  const params = validate(req.body, {
    username: Joi.string().required(),
    password: Joi.string().required()
  })

  let level
  let authed = false
  if (params.username in config.users) {
    const user = config.users[params.username]
    if (user.password === params.password) {
      authed = true
      level = user.level
    }
  }

  if (!authed) {
    throw Error('wrong user or password')
  }

  signToken({
    username: params.username,
    level
  }, req)

  res.json({level: 0})
})

module.exports = router
