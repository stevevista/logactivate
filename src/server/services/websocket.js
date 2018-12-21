'use strict'
const Router = require('koa-router')
const {MqttClient, brokeMqttOverSocket} = require('mqtt-over-web')
const {authenticateRequird, signDevice} = require('../auth')
const config = require('../config')

const router = new Router()

router.all('/mqtt/:product?/:device?', authenticateRequird(), async ctx => {
  let client

  const username = ctx.state.decoded_token.username
  const mqttCfg = config.mqtt || {}

  if (ctx.params.product && ctx.params.device) {
    const productKey = ctx.params.product
    const deviceName = ctx.params.device
    const d = await ctx.db.Device.findOne({
      productKey,
      deviceName
    })

    if (d) {
      const brokerUrl = d.brokerUrl || mqttCfg.brokerUrl
      const deviceSecret = d.deviceSecret

      if (mqttCfg.brokerUrl && mqttCfg.brokerUrl.indexOf('aliyuncs.com') !== -1) {
        client = new MqttClient({
          brokerUrl,
          productKey,
          deviceName,
          deviceSecret
        })
      } else {
        const password = signDevice({
          username
        }, {
          productKey, 
          deviceName, 
          deviceSecret
        })

        client = new MqttClient({
          brokerUrl,
          productKey,
          deviceName,
          deviceSecret,
          username,
          password
        })
      }
    }
  }

  if (!client) {
    client = new MqttClient({
      brokerUrl: mqttCfg.brokerUrl,
      username: ctx.state.decoded_token.username,
      password: ctx.state._token
    })
  }

  brokeMqttOverSocket(client, ctx.websocket)
})

module.exports = router
