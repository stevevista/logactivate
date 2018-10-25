'use strict'
const Router = require('express-promise-router')
const path = require('path')
const config = require('../config')

const router = Router()

router.get('/config', (req, res) => {
  // filter out crediential info
  const cfg = {
    port: config.port,
    logdir: config.logdir,
    dbStorage: config.database.storage,
    exceptionPath: path.join(config.logdir, config.exceptionFilename),
    exceptionFilesize: config.exceptionFilesize,
    cluster: config.cluster,
    logLevel: config.appLogLevel
  }
  res.json(cfg)
})

module.exports = router
