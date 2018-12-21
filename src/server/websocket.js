'use strict'
const Router = require('koa-router')
const {MqttClient, brokeMqttOverSocket} = require('mqtt-over-web')
const {authenticateRequird, signDevice} = require('./auth')
const config = require('./config')

const router = new Router()

router.all('/mqtt/:product?/:device?', authenticateRequird(), async ctx => {
  let client

  const mqttCfg = config.mqtt || {}
  let brokerUrl = mqttCfg.brokerUrl || 'mqtt:://localhost'
  const productKey = ctx.params.product
  const deviceName = ctx.params.device
  const username = ctx.state.decoded_token.username
  let password = ctx.state._token

  if (productKey && deviceName) { 
    const d = await ctx.db.Device.findOne({
      productKey,
      deviceName
    })

    if (d) {
      brokerUrl = d.brokerUrl || brokerUrl
      const deviceSecret = d.deviceSecret

      if (brokerUrl.indexOf('aliyuncs.com') !== -1) {
        client = new MqttClient({
          brokerUrl,
          productKey,
          deviceName,
          deviceSecret
        })
      } else {
        password = signDevice({
          username
        }, {
          productKey, 
          deviceName, 
          deviceSecret
        })
      }
    }
  }

  if (!client) {
    client = new MqttClient({
      brokerUrl,
      productKey,
      deviceName,
      username,
      password
    })
  }

  brokeMqttOverSocket(client, ctx.websocket)
})

module.exports = router
