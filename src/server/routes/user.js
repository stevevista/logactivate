'use strict'
const Router = require('express-promise-router')
const {authenticateRequird, authLevel, signToken, isSuper, higherLevelThan} = require('../auth')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const db = require('../models')
const errors = require('../utils/errors')
const Op = db.Sequelize.Op

const router = Router()

router.get('/auth', authenticateRequird(), (req, res) => {
  res.json(req.decoded_token)
})

router.post('/auth', async (req, res) => {
  const params = validate(req.body, {
    username: Joi.string().required(),
    password: Joi.string().required()
  })

  const dbuser = await db.users.findOne({
    where: {
      username: params.username
    }
  })

  let authed = false
  if (dbuser && !dbuser.disabled) {
    const ret = await dbuser.checkPassword(params.password)
    if (ret) {
      authed = true
    }
  }

  if (!authed) {
    throw Error('wrong user or password')
  }

  const tok = {
    id: dbuser.id,
    username: dbuser.username,
    level: dbuser.level
  }
  signToken(tok, res)

  res.json(tok)
})

router.post('/logout', (req, res) => {
  res.clearCookie('access_token')
  res.json({})
})

router.post('/password', authenticateRequird(), async (req, res) => {
  const params = validate(req.body, {
    password: Joi.string().required(),
    old_password: Joi.string().required()
  })

  const dbuser = await db.users.findOne({
    where: {
      username: req.decoded_token.username
    }
  })
  errors.assert(dbuser, `${req.decoded_token.username} not exists!`)

  const ret = await dbuser.checkPassword(params.old_password)
  errors.assert(ret, 'wrong password', 401)

  await db.users.updateEx({
    password: params.password
  }, {
    where: {
      username: req.decoded_token.username
    }
  })
  res.json({})
})

router.post('/:username/add', authenticateRequird(), authLevel('admin'), async (req, res) => {
  const params = validate(req.body, {
    password: Joi.string().required(),
    level: Joi.number().integer().required()
  })

  errors.assert(higherLevelThan(req.decoded_token, params.level), 'bad auth level', 401)

  try {
    await db.users.createEx({
      username: req.params.username,
      password: params.password,
      level: params.level,
      creator: req.decoded_token.username
    })
  } catch (e) {
    if (e instanceof db.Sequelize.UniqueConstraintError) {
      throw new Error('username already exists')
    }
    throw e
  }

  res.json({})
})

function queryAdminableUser(req, option, username) {
  option.where = {
    username
  }

  if (!isSuper(req.decoded_token)) {
    option.where.creator = req.decoded_token.username
  }
}

router.post('/:username/update', authenticateRequird(), authLevel('admin'), async (req, res) => {
  const params = validate(req.body, {
    password: Joi.string(),
    level: Joi.number().integer().required()
  })

  errors.assert(higherLevelThan(req.decoded_token, params.level), 'bad auth level', 401)

  const fields = {
    level: params.level
  }
  if (params.password) {
    fields.password = params.password
  }

  const option = {}

  queryAdminableUser(req, option, req.params.username)
  await db.users.updateEx(fields, option)

  res.json({})
})

router.post('/:username/del', authenticateRequird(), authLevel('admin'), async (req, res) => {

  const option = {}

  queryAdminableUser(req, option, req.params.username)
  await db.users.destroy(option)

  res.json({})
})

router.get('/list', authenticateRequird(), async (req, res) => {
  const option = {}

  if (!isSuper(req.decoded_token)) {
    option.where = {
      creator: req.decoded_token.username,
      level: {[Op.gt]: req.decoded_token.level}
    }
  } else {
    option.where = {
      username: {[Op.ne]: req.decoded_token.username}
    }
  }

  const users = await db.users.findAll(option)
  users.forEach(u => { u.password = undefined })
  res.json(users)
})

module.exports = router
