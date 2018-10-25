'use strict'
const Router = require('express-promise-router')
const {authenticateRequird, authLevel, signToken, isSuper, higherLevelThan} = require('../auth')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const bcrypt = require('bcrypt')
const db = require('../models')
const errors = require('../utils/errors')
const Op = db.Sequelize.Op

const router = Router()

router.get('/auth', authenticateRequird(), (req, res) => {
  res.json({
    username: req.decoded_token.username,
    level: req.decoded_token.level
  })
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
  if (dbuser) {
    const ret = await dbuser.checkPassword(params.password)
    if (ret) {
      authed = true
    }
  }

  if (!authed) {
    throw Error('wrong user or password')
  }

  signToken({
    username: dbuser.username,
    level: dbuser.level
  }, req)

  res.json({username: dbuser.username, level: dbuser.level})
})

router.post('/logout', (req, res) => {
  req.session.access_token = undefined
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

  const hashed = await bcrypt.hash(params.password, 10)
  await db.users.update({
    password: hashed
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

  const hashed = await bcrypt.hash(params.password, 10)
  try {
    await db.users.create({
      username: req.params.username,
      password: hashed,
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
    fields.password = await bcrypt.hash(params.password, 10)
  }

  const option = {
    where: {
      username: req.params.username
    }
  }
  if (!isSuper(req.decoded_token)) {
    option.where.creator = req.decoded_token.username
  }

  await db.users.update(fields, option)

  res.json({})
})

router.post('/:username/del', authenticateRequird(), authLevel('admin'), async (req, res) => {

  const option = {
    where: {
      username: req.params.username
    }
  }
  if (!isSuper(req.decoded_token)) {
    option.where.creator = req.decoded_token.username
  }
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
