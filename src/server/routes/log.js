'use strict'
const Router = require('express-promise-router')
const multer = require('multer')
const Joi = require('joi')
const path = require('path')
const {validate} = require('../utils/validate')
const fs = require('../utils/async-fs')
const logact = require('../logact')
const db = require('../models')
const {constructQuerySort, constructQueryFilter} = require('../utils/dbhelper')
const {authenticateRequird, authLevel} = require('../auth')
const config = require('../config')

const router = Router()

const upload = multer({dest: config.tmpdir})

router.get('/', (req, res) => {
  res.send('Hello LogActivate!')
})

const ObjectAttrs = [
  ['imei', 'imei', '--'],
  ['sn', 'sn', ''],
  ['latitude', 'latitude', 0.0],
  ['longitude', 'longitude', 0.0],
  ['swVersion', 'sw_version', ''],
  ['hwVersion', 'hw_version', ''],
  ['bbVersion', 'bb_version', '']
]

router.post('/report', async (req, res) => {
  let data = req.body
  if (typeof req.body.object === 'object') {
    // log cloud style exceptions
    data = req.body.object
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  const props = {
    ip
  }
  for (const attr of ObjectAttrs) {
    props[attr[0]] = data[attr[1]] || attr[2]
    delete data[attr[1]]
  }

  props.data = JSON.stringify(data)
  await db.log.create(props)

  logact.log('exception', props)
  
  res.json({})
})

function fileTrunkPath(imei, filename, trunks) {
  return path.join(config.tmpdir, `${imei}.${filename}.${trunks}`)
}

router.post('/upload', upload.single('file'), async (req, res) => {
  const params = validate(req.body, {
    imei: Joi.string().alphanum().required(),
    trunks: Joi.number().integer().min(1),
    eot: Joi.number().integer()
  })

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const dest = db.log_files.constructStorePath(params.imei, req.file.originalname)

  if (params.trunks) {
    if (!params.eot) {
      // don't move to dest yet
      await fs.rename(req.file.path, fileTrunkPath(params.imei, req.file.originalname, params.trunks))
      return res.json({})
    } else {
      const srcs = []
      for (let i = 1; i < params.trunks; i++) {
        srcs.push(fileTrunkPath(params.imei, req.file.originalname, i))
      }
      srcs.push(req.file.path)

      await fs.makeSureFileDir(dest)
      await fs.copy(srcs, dest)
      // remove old files
      for (const src of srcs) {
        await fs.unlink(src)
      }
    }
  } else {
    await fs.forceMove(req.file.path, dest)
  }

  await db.log_files.create({
    ip,
    imei: params.imei,
    filename: req.file.originalname
  })
  res.json({})
})

router.get('/exceptions', authenticateRequird(), authLevel('reporter'), async (req, res) => {
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

  constructQuerySort(option, params.sortField, params.sortOrder)
  constructQueryFilter(option, params.ip, 'ip', true)
  constructQueryFilter(option, params.imei, 'imei', true)
  constructQueryFilter(option, params.swVersion, 'swVersion', true)

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

router.get('/files/:imei', authenticateRequird(), authLevel('reporter'), async (req, res) => {
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
  const filepath = db.log_files.constructStorePath(req.params.imei, req.params.log)
  res.download(filepath, req.params.log, err => {
    if (err) {
      console.log(err)
      res.status(err.status).end()
    }
  })
})

module.exports = router
