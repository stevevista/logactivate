'use strict'
const Router = require('express-promise-router')
const path = require('path')
const yaml = require('js-yaml')
const fsOrgi = require('fs')
const fs = require('../utils/async-fs')
const uuid = require('uuid/v1')
const config = require('../config')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const db = require('../models')
const multer = require('multer')
const {authenticateRequird, authLevel} = require('../auth')
const url = require('url')
const Op = db.Sequelize.Op

const router = Router()

const storage = multer.diskStorage({})
const upload = multer({storage})

router.get('/packages', authenticateRequird(), authLevel(0), async (req, res) => {
  const params = validate(req.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string(),
    name: Joi.array().items(Joi.string()),
    address: Joi.array().items(Joi.string())
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

  if (params.name) {
    if (!option.where) {
      option.where = {}
    }
    option.where['name'] = {
      [Op.or]: params.name.map(n => ({[Op.like]: `%${n}%`}))
    }
  }

  if (params.desc) {
    if (!option.where) {
      option.where = {}
    }
    option.where['description'] = {
      [Op.or]: params.desc.map(n => ({[Op.like]: `%${n}%`}))
    }
  }

  const out = await db.ota_packages.findAndCountAll(option)
  
  res.json({
    totalCount: out.count,
    results: out.rows
  })
})

router.post('/upload', 
  authenticateRequird(), 
  authLevel(0),
  upload.single('file'), 
  async (req, res) => {

    const params = validate(req.body, {
      version: Joi.string().required(),
      desc: Joi.string()
    })

    const destname = uuid()
    const dest = path.join(config.ota.firmwareDir, destname)
    await fs.makeSureFileDir(dest)
    await fs.rename(req.file.path, dest)

    await db.ota_packages.create({
      name: req.file.originalname,
      version: params.version,
      filename: destname,
      description: params.desc
    })
    res.json({})
  }
)

router.post('/delete/:id([0-9]+)', authenticateRequird(), authLevel(0), async (req, res) => {
  const id = +req.params.id
  const r = await db.ota_packages.findOne({
    where: {id}
  })
  const filepath = r.storePath()

  await db.ota_packages.destroy({
    where: {id}
  })
  
  await fs.unlink(filepath)
  res.json({path: r.fullDownloadURI(req)})
})

router.get('/versions', async (req, res) => {
  const out = await db.ota_packages.findAll()
  const results = out.map(r => ({
    name: r.name,
    version: r.version,
    description: r.description,
    updatedAt: r.updatedAt,
    firmware: r.fullDownloadURI(req)
  }))
  res.json(results)
})

router.get('/version', (req, res) => {
  const cfgpath = path.join(config.configDir, 'ota.yml')
  const otainfo = yaml.safeLoad(fsOrgi.readFileSync(cfgpath, 'utf8'))
  otainfo.firmware = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: '/ota/download/' + otainfo.firmware
  })
  res.json(otainfo)
})

router.get('/download/:firmware', (req, res) => {
  const filepath = path.join(config.ota.firmwareDir, req.params.firmware)
  res.download(filepath, req.params.firmware, err => {
    if (err) {
      console.log(err)
      res.status(err.status).end()
    }
  })
})

module.exports = router
