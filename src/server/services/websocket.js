'use strict'
const WebSocket = require('ws')
const url = require('url')
const Router = require('koa-router')
const MQTT = require('../utils/mqtt-client')
const {authenticateRequird} = require('../auth')
const config = require('../config')

const router = new Router()

router.all('/mqtt/:topicName/:acc?', authenticateRequird(), async ctx => {

  const {topicName, acc} = ctx.params
  const topic = topicName.replace('.', '/')

  const client = new MQTT({
    ...config.mqtt,
    username: ctx.state.decoded_token.username,
    password: ctx.state._token
  })

  client.on('connect', () => {
    if (acc !== 'publish') {
      client.subscribeAndListen(topic, (err, topic, message) => {
        if (err) {
          ctx.websocket.send('subscribe fail', e => { if (e) console.log(e) })
          ctx.websocket.close()
          return
        }

        ctx.websocket.send(message.toString(), e => { if (e) console.log(e) })
      })
    }
  })

  client.on('error', err => {
    console.log(err)
    ctx.websocket.send('mqtt error', e => { if (e) console.log(e) })
    ctx.websocket.close()
  })

  ctx.websocket.on('close', () => {
    client.end()
  })

  if (acc !== 'subscribe') {
    ctx.websocket.on('message', (data) => {
      client.publish(topic, data)
    })
  }
})

function bind(app, server) {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', async (socket, req) => {
    const ctx = app.createContext(req)
    ctx.websocket = socket
    ctx.path = url.parse(req.url).pathname

    try {
      await router.routes()(ctx, () => {
        console.log('Not Found Websocket path')
        socket.close()
      })
    } catch (e) {
      console.log('ws error', e)
      socket.close()
    }
  })
}

module.exports = bind
