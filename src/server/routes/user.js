'use strict'
const Router = require('koa-router')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const {authenticateRequird, authLevel, signToken, isSuper, higherLevelThan} = require('../auth')
const config = require('../config')

const router = new Router()

router.get('/auth', authenticateRequird(), async ctx => {
  ctx.body = ctx.state.decoded_token
})

router.post('/auth', async ctx => {
  const params = validate(ctx.request.body, {
    username: Joi.string().required(),
    password: Joi.string().required()
  })

  const dbuser = await ctx.db.User.login(params.username, params.password)
  ctx.assert(dbuser, 401, 'wrong user or password')

  const tok = {
    id: dbuser._id,
    username: dbuser.username,
    level: dbuser.level
  }
  const token = await signToken(tok)
  ctx.cookies.set('access_token', token, { maxAge: config.session.maxAge })

  ctx.body = tok
})

router.post('/logout', ctx => {
  ctx.cookies.set('access_token', undefined)
  ctx.body = ''
})

router.post('/password', authenticateRequird(), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string().required(),
    old_password: Joi.string().required()
  })

  const dbuser = await ctx.db.User.findOne({
    username: ctx.state.decoded_token.username
  })
  ctx.assert(dbuser, 400, `${ctx.state.decoded_token.username} not exists!`)

  const ret = await dbuser.verify(params.old_password)
  ctx.assert(ret, 401, 'wrong password')

  dbuser.password = params.password
  await dbuser.save()

  ctx.body = ''
})

router.post('/:username/add', authLevel('admin'), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string().required(),
    level: Joi.number().integer().required()
  })

  ctx.assert(ctx.state.decoded_token.username, 401, 'bad user')
  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  try {
    await ctx.db.User.create({
      username: ctx.params.username,
      password: params.password,
      level: params.level,
      creator: ctx.state.decoded_token.username
    })
  } catch (e) {
    ctx.throw('username already exists')
    throw e
  }

  ctx.body = ''
})

function queryAdminableUser(ctx, option, username) {
  option.username = username

  if (!isSuper(ctx)) {
    option.creator = ctx.state.decoded_token.username
  }
}

router.post('/:username/update', authLevel('admin'), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string(),
    level: Joi.number().integer().required()
  })

  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  const fields = {
    level: params.level
  }
  if (params.password) {
    fields.password = params.password
  }

  const option = {}

  queryAdminableUser(ctx, option, ctx.params.username)
  await ctx.db.User.update(option, fields)

  ctx.body = ''
})

router.post('/:username/del', authLevel('admin'), async ctx => {

  const option = {}

  queryAdminableUser(ctx, option, ctx.params.username)
  await ctx.db.User.deleteOne(option)

  ctx.body = ''
})

router.get('/list', authLevel('admin'), async ctx => {
  const option = {}

  if (!isSuper(ctx)) {
    option.creator = ctx.state.decoded_token.username
    option.level = {$gt: ctx.state.decoded_token.level}
  } else {
    option.username = {$ne: ctx.state.decoded_token.username}
  }

  const users = await ctx.db.User.find(option).lean()
  users.forEach(u => { u.password = undefined })
  ctx.body = users
})

router.post('/share-token', authenticateRequird(), async ctx => {
  const params = validate(ctx.request.body, {
    level: Joi.number().integer().required(),
    max_age: Joi.number().integer().max(60 * 60 * 24 * 7).default(60 * 60)
  })

  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  const tok = {
    level: params.level,
    owner: ctx.state.decoded_token.username
  }
  const signed = await signToken(tok, {maxAge: params.max_age})

  ctx.body = signed
})

module.exports = router
