'use strict'
const Router = require('koa-router')
const {decodeToken} = require('../auth')

const router = Router()

router.post('/auth', async ctx => {
  const {username, password} = ctx.request.body

  if (username.length > 100) {
    // token, dont care password
    const u = await decodeToken(username)
      .catch(e => ctx.throw(403))
    ctx.assert(u.id, 403)
    ctx.body = {}
    return
  }

  const dbuser = await ctx.db.users.findOne({
    where: {
      username
    }
  })

  const authed = dbuser && await dbuser.checkPassword(password)
  ctx.assert(authed, 401, 'wrong user or password')

  ctx.body = {}
})

router.post('/superuser', async ctx => {
  const {username} = ctx.request.body

  if (username.length > 100) {
    // token, dont care password
    const u = await decodeToken(username)
      .catch(e => ctx.throw(403))
    ctx.assert(u.id && u.super, 403)
    ctx.body = {}
    return
  }

  const dbuser = await ctx.db.users.findOne({
    where: {
      username,
      level: 0
    }
  })
  ctx.assert(dbuser && !dbuser.disabled, 403)
  ctx.body = {}
})

router.post('/acl', async ctx => {
  const {username, clientid, topic, acc} = ctx.request.body
  console.log(username, clientid, topic, acc)
  ctx.body = {}
})

module.exports = router
