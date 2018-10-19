'use strict'
const {AsyncRouter} = require('express-async-router')
const path = require('path')
const config = require('../config')

const router = AsyncRouter()

router.get('/config', (req, res) => {
  // filter out crediential info
  const cfg = {
    port: config.port,
    logdir: config.logdir,
    dbStorage: config.database.storage,
    exceptionPath: path.join(config.logdir, config.exceptionFilename),
    exceptionFilesize: config.exceptionFilesize,
    cluster: config.cluster
  }
  res.json(cfg)
})

module.exports = router
