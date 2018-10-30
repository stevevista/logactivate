'use strict'
const WebSocket = require('ws')
const url = require('url')
const Router = require('koa-router')
const MQTT = require('mqtt')
const {authenticateRequird} = require('../auth')
const config = require('../config')

const router = new Router()

router.all('/mqtt/:topic', authenticateRequird(), async ctx => {
  // ctx.state._token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzeXNhZG1pbiIsImxldmVsIjowLCJpYXQiOjE1NDA4NzIxMDMsImV4cCI6MTU0MDk1ODUwM30.vjSJBjsu5K6B8yTfjB-qqdv01iMpVNET3A18PAtypYw'
  const client = MQTT.connect(config.mqttServer, {
    username: ctx.state._token,
    password: '1'
  })
  client.on('connect', () => {
    client.subscribe(ctx.params.topic, err => {
      if (err) {
        ctx.websocket.send('subscribe fail')
        ctx.websocket.close()
      }
    })
  })

  client.on('message', function (topic, message) {
    ctx.websocket.send(message.toString())
  })

  client.on('error', err => {
    console.log(err)
    ctx.websocket.send('mqtt error')
    ctx.websocket.close()
  })

  ctx.websocket.on('close', () => {
    client.end()
  })
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
