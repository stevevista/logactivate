'use strict'
const Router = require('koa-router')
const {decodeToken} = require('../auth')

const router = Router()

router.post('/auth', async ctx => {
  const {username, password} = ctx.request.body

  if (password.length > 100) {
    // jwt token
    try {
      const u = await decodeToken(password, ctx.db)
      ctx.assert(u.username === username, 403)
    } catch (e) {
      // pass
      ctx.throw(403)
    }
  } else {
    // user transfer plain password
    const dbuser = await ctx.db.User.login(username, password)
    ctx.assert(dbuser, 401, 'wrong user or password')
  }

  ctx.body = ''
})

router.post('/superuser', async ctx => {
  const {username} = ctx.request.body

  const dbuser = await ctx.db.User.findOne({
    username,
    level: 0
  })
  ctx.assert(dbuser && !dbuser.disabled, 403)
  ctx.body = ''
})

router.post('/acl', async ctx => {
  const {username, clientid, topic, acc} = ctx.request.body

  console.log(username, clientid, topic, acc)
  ctx.body = ''
})

module.exports = router
