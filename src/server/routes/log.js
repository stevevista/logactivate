'use strict'
const {AsyncRouter} = require('express-async-router')
const multer = require('multer')
const fs = require('../utils/async-fs')
const path = require('path')
const config = require('../config')
const logact = require('../logact')
const {isAuthenticated, signToken} = require('../auth')

const router = AsyncRouter()
const upload = multer()

async function saveLogfile (imei, file) {
  const dir = path.join(config.logdir, imei)
  await fs.mkdir(dir, {recursive: true, check: true})
  return fs.writeFile(path.join(dir, file.originalname), file.buffer)
}

router.get('/sign', (req, res) => {
  let token = signToken('abc')
  req.session.access_token = token
  res.send(token)
})

router.use(isAuthenticated(false))

router.get('/', (req, res) => {
  res.send('Hello LogActivate!')
})

router.post('/report', async (req, res) => {
  logact.log('exception', req.body)
  res.json({})
})

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.body.imei) {
    throw Error('invalid imei parameters')
  }
  await saveLogfile(req.body.imei, req.file)
  res.json({})
})

module.exports = router
