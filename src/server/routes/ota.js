'use strict'
const Router = require('express-promise-router')
const fs = require('../utils/async-fs')
const uuid = require('uuid/v1')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const db = require('../models')
const {constructQuerySort} = require('../utils/dbhelper')
const multer = require('multer')
const {authenticateRequird, authLevel} = require('../auth')
const config = require('../config')

const router = Router()

const upload = multer({dest: config.tmpdir})

router.get('/packages', authenticateRequird(), authLevel('reporter'), async (req, res) => {
  const params = validate(req.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string()
  })

  const offset = (params.page - 1) * params.results
  const option = {
    limit: params.results,
    offset
  }

  constructQuerySort(option, params.sortField, params.sortOrder)

  const out = await db.ota_packages.findAndCountAll(option)
  
  res.json({
    totalCount: out.count,
    results: out.rows
  })
})

router.post('/upload', 
  authenticateRequird(), 
  authLevel('admin'),
  upload.single('file'), 
  async (req, res) => {

    const params = validate(req.body, {
      version: Joi.string().required(),
      desc: Joi.string()
    })

    const destname = uuid()
    const dest = db.ota_packages.constructStorePath(destname)
    await fs.forceMove(req.file.path, dest)

    await db.ota_packages.create({
      name: req.file.originalname,
      version: params.version,
      filename: destname,
      description: params.desc
    })
    res.json({})
  }
)

router.post('/delete/:id([0-9]+)', authenticateRequird(), authLevel('admin'), async (req, res) => {
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

router.get('/download/:firmware', (req, res) => {
  const filepath = db.ota_packages.constructStorePath(req.params.firmware)
  res.download(filepath, req.params.firmware, err => {
    if (err) {
      console.log(err)
      res.status(err.status).end()
    }
  })
})

module.exports = router
