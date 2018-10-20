'use strict'
const {AsyncRouter} = require('express-async-router')
const multer = require('multer')
const fs = require('../utils/async-fs')
const path = require('path')
const config = require('../config')
const logact = require('../logact')

const router = AsyncRouter()

const storage = multer.diskStorage({})
const upload = multer({storage})

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
  const dir = path.join(config.logdir, req.body.imei)
  await fs.mkdir(dir, {recursive: true, check: true})
  const dest = path.join(dir, req.file.originalname)

  if (req.body.trunks) {
    const trunks = +req.body.trunks
    const eot = req.body.eot
    if (!eot) {
      await fs.rename(req.file.path, dest + '.' + trunks)
    } else {
      const srcs = []
      for (let i = 1; i < trunks; i++) {
        srcs.push(dest + '.' + i)
      }
      srcs.push(req.file.path)
      await fs.copy(srcs, dest)
      // remove old files
      for (const src of srcs) {
        await fs.unlink(src)
      }
    }
  } else {
    await fs.rename(req.file.path, dest)
  }
  res.json({})
})

module.exports = router
