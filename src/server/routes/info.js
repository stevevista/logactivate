'use strict'
const Router = require('koa-router')
const {authenticateRequird} = require('../auth')
const config = require('../config')

const router = Router()

router.get('/config', authenticateRequird(), ctx => {
  // filter out crediential info
  const cfg = {
    port: config.port,
    logdir: config.logdir,
    cluster: config.cluster,
    logLevel: config.appLogLevel
  }
  ctx.body = cfg
})

module.exports = router
