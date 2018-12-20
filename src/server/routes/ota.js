'use strict'
const Router = require('koa-router')
const range = require('koa-range')
const fs = require('../utils/async-fs')
const uuid = require('uuid/v1')
const send = require('koa-send')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const {constructQuerySort} = require('../utils/dbhelper')
const koaBody = require('koa-body')
const {authLevel} = require('../auth')
const config = require('../config')

const router = Router()

router.get('/packages', authLevel('reporter'), async ctx => {
  const params = validate(ctx.query, {
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

  const out = await ctx.db.ota_packages.findAndCountAll(option)
  
  ctx.body = {
    totalCount: out.count,
    results: out.rows
  }
})

router.post('/upload', authLevel('admin'), koaBody({
  multipart: true,
  formidable: {
    uploadDir: config.tmpdir,
    maxFileSize: config.maxUploadFileSize
  }
}), async ctx => {

  const params = validate(ctx.request.body, {
    version: Joi.string().required(),
    desc: Joi.string()
  })

  const destname = uuid()
  const dest = ctx.db.ota_packages.constructStorePath(destname)
  const file = ctx.request.files.file
  await fs.forceMove(file.path, dest)

  await ctx.db.ota_packages.create({
    name: file.name,
    version: params.version,
    filename: destname,
    description: params.desc
  })
  ctx.body = ''
})

router.post('/delete/:id([0-9]+)', authLevel('admin'), async ctx => {
  const id = +ctx.params.id
  const r = await ctx.db.ota_packages.findOne({
    where: {id}
  })
  const filepath = r.storePath()

  await ctx.db.ota_packages.destroy({
    where: {id}
  })
  
  await fs.unlink(filepath)
  ctx.body = ''
})

router.get('/version', async ctx => {
  const r = await ctx.db.ota_packages.findOne({
    order: [
      ['updatedAt', 'DESC']
    ]
  })

  if (!r) {
    ctx.body = {}
    return
  }

  ctx.body = {
    name: r.name,
    version: r.version,
    description: r.description,
    updatedAt: r.updatedAt,
    firmware: r.fullDownloadURI(ctx)
  }
})

router.get('/versions', async ctx => {
  const out = await ctx.db.ota_packages.findAll()
  const results = out.map(r => ({
    name: r.name,
    version: r.version,
    description: r.description,
    updatedAt: r.updatedAt,
    firmware: r.fullDownloadURI(ctx)
  }))
  ctx.body = results
})

router.get('/download/:firmware', range, async ctx => {
  const filepath = ctx.db.ota_packages.constructStorePath(ctx.params.firmware)
  ctx.attachment(ctx.firmware)
  await send(ctx, filepath, {root: '/'})
})

module.exports = router
