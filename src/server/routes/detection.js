'use strict'
const Router = require('koa-router')
const PartialUpload = require('koa-partial-upload')
const path = require('path')
const send = require('koa-send')
const axios = require('axios')
const {Client} = require('mqtt-over-web')
const {authLevel} = require('../auth')
const config = require('../config')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const router = Router()

let uuid = 1
let featureFace = {
  detectFace: true
}

router.post('/upload', authLevel('visitor'), PartialUpload({
  uploadDir: config.imgdir,
  keepExtensions: true
}), async ctx => {

  if (!ctx.request.files.file || ctx.request.files.file.patial) {
    ctx.body = ''
    return
  }

  const file = ctx.request.files.file
  const filepath = file.path
  const filename = path.basename(file.path)

  const params = validate(ctx.request.body, {
    product: Joi.string().required(),
    device: Joi.string().required()
  })

  const mqttCfg = config.mqtt || {brokerUrl: 'mqtt:://localhost'}
  mqttCfg.password = mqttCfg.password || ctx.state._token
  mqttCfg.username = mqttCfg.username || ctx.state.decoded_token.username

  ctx.body = ''

  const id = uuid++
  Client.sendMessage(mqttCfg, `sys/${params.product}/${params.device}/screen/upload`, JSON.stringify({
    id,
    url: filename
  }))

  let spec
  if (!featureFace.detectFace) {
    spec = 'detect_object'
  } else {
    spec = JSON.stringify(featureFace.desc || [])
    spec = spec.slice(1, spec.length - 1)
  }
  
  setImmediate(() => {
    axios({
      url: config.imageServer,
      method: 'post',
      data: {
        filepath,
        spec
      },
      transformRequest: [function (data) {
        // Do whatever you want to transform the data
        let ret = ''
        for (let it in data) {
          ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
        }
        return ret
      }],
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(ret => {
        const data = ret.data
        data.id = id
        Client.sendMessage(mqttCfg, `sys/${params.product}/${params.device}/shot/detect`, JSON.stringify(data))
      })
      
  })
})

router.get('/files/:filename', authLevel('visitor'), async ctx => {
  const filepath = path.resolve(config.imgdir, ctx.params.filename)
  await send(ctx, filepath, {root: '/'})
})

router.get('/feature-face', authLevel('visitor'), ctx => {
  ctx.body = featureFace
})

router.post('/feature-face', authLevel('visitor'), ctx => {
  featureFace = ctx.request.body.feature
  ctx.body = ''
})

module.exports = router
