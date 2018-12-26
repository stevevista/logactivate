'use strict'
const {WebSocketRouter} = require('koa-app-server')
const {Client, brokeMqttOverSocket} = require('mqtt-over-web')
const {authenticateRequird, signDevice} = require('./auth')
const config = require('./config')

const router = new WebSocketRouter()

router.route('/mqtt/:product?/:device?', authenticateRequird(), async ctx => {
  const mqttCfg = config.mqtt || {}
  let brokerUrl = mqttCfg.brokerUrl || 'mqtt:://localhost'
  let deviceSecret = mqttCfg.deviceSecret
  let password = mqttCfg.password || ctx.state._token
  const productKey = ctx.params.product || mqttCfg.productKey
  const deviceName = ctx.params.device || mqttCfg.deviceName
  const username = mqttCfg.username || ctx.state.decoded_token.username

  if (productKey && deviceName) { 
    const d = await ctx.db.Device.findOne({
      productKey,
      deviceName
    })

    if (d) {
      brokerUrl = d.brokerUrl || brokerUrl
      deviceSecret = d.deviceSecret || deviceSecret

      if (brokerUrl.indexOf('aliyuncs.com') === -1) {
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

  const client = new Client({
    ...mqttCfg,
    brokerUrl,
    deviceSecret,
    productKey,
    deviceName,
    username,
    password
  })

  brokeMqttOverSocket(client, ctx.websocket)
})

module.exports = router
