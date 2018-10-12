'use strict'
const router = require('express').Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
// const db = require('../models')
const config = require('../config')
const logger = require('log4js').getLogger()
const logact = require('../logact')

const upload = multer()

function writeFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function mkdir (path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function saveLogfile (imei, file) {
  const dir = path.join(config.logdir, imei)
  if (!fs.existsSync(dir)) {
    await mkdir(dir)
  }
  return writeFile(path.join(dir, file.originalname), file.buffer)
}

router.get('/', (req, res) => {
  res.send('Hello LogActivate!')
})

router.post('/report', async (req, res) => {
  try {
    logact.log('exception', req.body)
    /*
    if (!req.body.imei) {
      throw Error('invalid imei parameters')
    }
    await db.log.create({
      imei: req.body.imei
    })
    */
  } catch (e) {
    logger.fatal(e.message)
    return res.status(500).json({message: e.message})
  }

  res.json({})
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.body.imei) {
      throw Error('invalid imei parameters')
    }
    await saveLogfile(req.body.imei, req.file)
  } catch (e) {
    logger.fatal(e.message)
    return res.status(500).json({message: e.message})
  }

  res.json({})
})

module.exports = router
