'use strict'
const Router = require('express-promise-router')
const multer = require('multer')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const fs = require('../utils/async-fs')
const path = require('path')
const config = require('../config')
const logact = require('../logact')
const db = require('../models')
const {authenticateRequird, authLevel} = require('../auth')
const Op = db.Sequelize.Op

const router = Router()

const storage = multer.diskStorage({})
const upload = multer({storage})

router.get('/', (req, res) => {
  res.send('Hello LogActivate!')
})

router.post('/report', async (req, res) => {
  let data = req.body
  if (typeof req.body.object === 'object') {
    // log cloud style exceptions
    data = req.body.object
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const imei = data.imei || '--'
  const sn = data.sn || ''
  const latitude = data.latitude || 0.0
  const longitude = data.longitude || 0.0
  const swVersion = data.sw_version || ''
  const hwVersion = data.hw_version || ''
  const bbVersion = data.bb_version || ''

  for (const attr of ['imei', 'sn', 'latitude', 'longitude', 'sw_version', 'hw_version', 'bb_version']) {
    delete data[attr]
  }

  await db.log.create({
    ip,
    imei,
    sn,
    latitude,
    longitude,
    swVersion,
    hwVersion,
    bbVersion,
    data: JSON.stringify(data)
  })

  logact.log('exception', ip, imei, sn, latitude, longitude, swVersion, hwVersion, bbVersion, data)
  
  res.json({})
})

router.post('/upload', 
  upload.single('file'), 
  async (req, res) => {
    validate(req.body, {
      imei: Joi.string().alphanum().required(),
      trunks: Joi.number().integer().min(1),
      eot: Joi.number().integer()
    })

    const dest = path.join(config.logdir, req.body.imei, req.file.originalname)
    await fs.makeSureFileDir(dest)
  
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

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

        await db.log_files.create({
          ip,
          imei: req.body.imei,
          filename: req.file.originalname
        })
      }
    } else {
      await fs.rename(req.file.path, dest)
      await db.log_files.create({
        ip,
        imei: req.body.imei,
        filename: req.file.originalname
      })
    }
    res.json({})
  }
)

router.get('/exceptions', authenticateRequird(), authLevel(0), async (req, res) => {
  const params = validate(req.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string(),
    ip: Joi.array().items(Joi.string()),
    imei: Joi.array().items(Joi.string()),
    swVersion: Joi.array().items(Joi.string())
  })

  const offset = (params.page - 1) * params.results
  const option = {
    limit: params.results,
    offset
  }
  if (params.sortField) {
    const order = [params.sortField]
    if (params.sortOrder === 'descend') {
      order.push('DESC')
    }
    option.order = [order]
  }

  const filter = (col, equal) => {
    if (params[col]) {
      if (!option.where) {
        option.where = {}
      }
      if (equal) {
        option.where[col] = {
          [Op.or]: params[col].map(n => ({[Op.eq]: n}))
        }
      } else {
        option.where[col] = {
          [Op.or]: params[col].map(n => ({[Op.like]: `%${n}%`}))
        }
      }
    }
  }

  filter('ip', true)
  filter('imei', true)
  filter('swVersion', true)

  if (params.desc) {
    if (!option.where) {
      option.where = {}
    }
    option.where['description'] = {
      [Op.or]: params.desc.map(n => ({[Op.like]: `%${n}%`}))
    }
  }

  const ips = await db.log.findAll({
    attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('ip')), 'ip']]
  })
  const imeis = await db.log.findAll({
    attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('imei')), 'imei']]
  })
  const versions = await db.log.findAll({
    attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('swVersion')), 'swVersion']]
  })
  const out = await db.log.findAndCountAll(option)
  
  res.json({
    totalCount: out.count,
    results: out.rows,
    ips: ips.map(r => r.ip),
    imeis: imeis.map(r => r.imei),
    versions: versions.map(r => r.swVersion)
  })
})

router.get('/files/:imei', authenticateRequird(), authLevel(0), async (req, res) => {
  const out = await db.log_files.findAll({
    where: {imei: req.params.imei}
  })
  const results = out.map(r => ({
    id: r.id,
    filename: r.filename,
    url: r.fullDownloadURI(req)
  }))
  res.json(results)
})

router.get('/download/:imei/:log', (req, res) => {
  const filepath = path.join(config.logdir, req.params.imei, req.params.log)
  res.download(filepath, req.params.log, err => {
    if (err) {
      console.log(err)
      res.status(err.status).end()
    }
  })
})

module.exports = router
