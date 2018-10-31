'use strict'
const Router = require('koa-router')
const MQTT = require('../utils/mqtt-client')
const config = require('../config')
const {decodeToken, authenticateRequird} = require('../auth')

const router = Router()

router.post('/auth', async ctx => {
  const {username, password} = ctx.request.body

  if (password.length > 100) {
    // token
    const u = await decodeToken(password)
      .catch(e => ctx.throw(403))
    ctx.assert(u.username === username, 403)
  } else {
    const dbuser = await ctx.db.users.findOne({
      where: {
        username
      }
    })
  
    const authed = dbuser && await dbuser.checkPassword(password)
    ctx.assert(authed, 401, 'wrong user or password')
  }

  ctx.body = ''
})

router.post('/superuser', async ctx => {
  const {username} = ctx.request.body

  const dbuser = await ctx.db.users.findOne({
    where: {
      username,
      level: 0
    }
  })
  ctx.assert(dbuser && !dbuser.disabled, 403)

  ctx.body = ''
})

router.post('/acl', async ctx => {
  const {username, clientid, topic, acc} = ctx.request.body

  console.log(username, clientid, topic, acc)
  ctx.body = ''
})

router.post('/pub', authenticateRequird(), async ctx => {
  const {topic, message} = ctx.request.body
  const client = new MQTT({
    ...config.mqtt,
    username: ctx.state.decoded_token.username,
    password: ctx.state._token
  })

  await new Promise((resolve, reject) => {
    client.on('connect', async () => {
      try {
        await client.publish(topic, message)
        await client.end()
        resolve()
      } catch (e) {
        reject(e)
      }
    })

    client.on('error', e => {
      client.end()
      reject(e)
    })
  })

  ctx.body = ''
})

module.exports = router
