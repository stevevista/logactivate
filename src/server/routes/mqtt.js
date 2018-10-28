'use strict'
const Router = require('koa-router')

const router = Router()

router.post('/auth', async ctx => {

  const dbuser = await ctx.db.users.findOne({
    where: {
      username: ctx.request.username
    }
  })

  const authed = dbuser && await dbuser.checkPassword(ctx.request.password)
  ctx.assert(authed, 401, 'wrong user or password')

  console.log(ctx.request.username, ctx.request.password, ctx.request.topic, ctx.request.acc)
  ctx.body = {}
})

router.post('/superuser', async ctx => {

  const dbuser = await ctx.db.users.findOne({
    where: {
      username: ctx.request.username
    }
  })
  ctx.assert(dbuser && dbuser.level === 0 && !dbuser.disabled, 403)
  ctx.body = {}
})

router.post('/acl', async ctx => {

  console.log(ctx.request.username, ctx.request.clientid, ctx.request.topic, ctx.request.acc)
  ctx.body = {}
})

module.exports = router
