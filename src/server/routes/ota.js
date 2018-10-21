'use strict'
const {Router} = require('express')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')
const config = require('../config')

const router = Router()

router.get('/version', (req, res) => {
  const cfgpath = path.join(config.configDir, 'ota.yml')
  const otainfo = yaml.safeLoad(fs.readFileSync(cfgpath, 'utf8'))
  res.json(otainfo)
})

router.get('/download/:firmware', (req, res) => {
  const filepath = path.join(config.ota.firmwareDir, req.params.firmware)
  console.log(filepath)
  res.download(filepath, req.params.firmware, err => {
    if (err) {
      console.log(err)
      res.status(err.status).end()
    }
  })
})

module.exports = router
