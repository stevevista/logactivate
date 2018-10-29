'use strict'
const Router = require('koa-router')

const router = Router()

router.post('/auth', async ctx => {
  const {username, password, topic, acc} = ctx.request.body
  const dbuser = await ctx.db.users.findOne({
    where: {
      username
    }
  })

  const authed = dbuser && await dbuser.checkPassword(password)
  ctx.assert(authed, 401, 'wrong user or password')

  console.log(topic, acc)
  ctx.body = {}
})

router.post('/superuser', async ctx => {

  const dbuser = await ctx.db.users.findOne({
    where: {
      username: ctx.request.body.username,
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
