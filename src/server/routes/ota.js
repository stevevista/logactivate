'use strict'
const Router = require('koa-router')
const range = require('koa-range')
const fs = require('../utils/async-fs')
const path = require('path')
const send = require('koa-send')
const url = require('url')
const Joi = require('joi')
const {validate} = require('../utils/validate')
const {appendQueryPaging, appendQuerySort} = require('../utils/dbhelper')
const PartialUpload = require('koa-partial-upload')
const {authLevel} = require('../auth')
const config = require('../config')
const logger = require('log4js').getLogger()

const router = Router()

function getPackageUrl(p, ctx) {
  return url.format({
    protocol: ctx.protocol,
    host: ctx.host,
    pathname: '/ota/download/' + p._id
  })
}

router.get('/packages', authLevel('reporter'), async ctx => {
  const params = validate(ctx.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string()
  })

  let query = ctx.db.Package.find({})
  query = appendQueryPaging(query, params.page, params.results)
  query = appendQuerySort(query, params.sortField, params.sortOrder)

  const totalCount = await ctx.db.Package.countDocuments({})
  const results = await query.lean()

  results.forEach(e => {
    e.url = getPackageUrl(e, ctx)
  })
  
  ctx.body = {
    totalCount,
    results
  }
})

router.post('/upload', authLevel('admin'), PartialUpload({
  uploadDir: config.otaStorage,
  maxFileSize: config.maxUploadFileSize
}), async ctx => {

  const params = validate(ctx.request.body, {
    version: Joi.string().required(),
    desc: Joi.string()
  })

  const file = ctx.request.files.file
  const storename = path.basename(file.path)

  await ctx.db.Package.create({
    name: file.name,
    version: params.version,
    filename: file.name,
    storename,
    filesize: file.size,
    description: params.desc
  })
  ctx.body = ''
})

router.post('/delete/:id', authLevel('admin'), async ctx => {
  const r = await ctx.db.Package.findById(ctx.params.id)
  if (!r) {
    ctx.status = 400
    ctx.body = ''
    return
  }

  const filepath = path.join(config.otaStorage, r.storename)
  await r.remove()
  await fs.unlink(filepath).catch(e => logger.error(e))
  ctx.body = ''
})

router.get('/version', async ctx => {
  const r = await ctx.db.Package.findOne().sort({updatedAt: -1})

  if (!r) {
    ctx.body = {}
    return
  }

  ctx.body = {
    name: r.name,
    version: r.version,
    description: r.description,
    updatedAt: r.updatedAt,
    firmware: getPackageUrl(r, ctx)
  }
})

router.get('/versions', async ctx => {
  const out = await ctx.db.Package.find()
  const results = out.map(r => ({
    name: r.name,
    version: r.version,
    description: r.description,
    updatedAt: r.updatedAt,
    firmware: getPackageUrl(r, ctx)
  }))
  ctx.body = results
})

router.get('/download/:doc_id', range, async ctx => {
  const doc = await ctx.db.Package.findById(ctx.params.doc_id)
  if (!doc) {
    ctx.status = 400
    ctx.body = ''
    return
  }

  const filepath = path.join(config.otaStorage, doc.storename)
  ctx.attachment(doc.filename)
  await send(ctx, filepath, {root: '/'})
})

module.exports = router
