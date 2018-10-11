'use strict'
const router = require('express').Router()
const multer = require('multer')
const fs = require('fs')
const db = require('../models')

const logger = require('log4js').getLogger()

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

router.get('/', (req, res) => {
  res.send('Hello World!')
})

router.post('/', (req, res) => {
  console.log(req.body)
})

router.post('/report', async (req, res) => {
  try {
    if (!req.body.imei) {
      throw Error('invalid imei parameters')
    }
    await db.log.create({
      imei: req.body.imei
    })
  } catch (e) {
    logger.fatal(e.message)
    return res.status(500).json({message: e.message})
  }

  res.json({status: 0})
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.body.imei) {
      throw Error('invalid imei parameters')
    }
    await writeFile(`./${req.body.imei}_output.pdf`, req.file.buffer)
  } catch (e) {
    logger.fatal(e.message)
    return res.status(500).json({message: e.message})
  }

  res.json({})
})

module.exports = router
