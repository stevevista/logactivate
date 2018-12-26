'use strict'
const Router = require('koa-router')
const range = require('koa-range')
const Joi = require('joi')
const path = require('path')
const send = require('koa-send')
const url = require('url')
const {validate} = require('../utils/validate')
const fs = require('../utils/async-fs')
const {appendQueryPaging, appendQuerySort, constructQueryFilter} = require('../utils/dbhelper')
const {authLevel} = require('../auth')
const config = require('../config')
const PartialUpload = require('koa-partial-upload')
const uuid = require('uuid/v1')
const router = Router()

router.get('/', ctx => {
  ctx.body = 'Hello LogActivate!'
})

router.post('/upload', PartialUpload({
  uploadDir: config.tmpdir,
  maxFileSize: config.maxUploadFileSize
}), async ctx => {
  // format document
  let data = ctx.request.body
  if (typeof data.object === 'object') {
    // log cloud style exceptions
    data = data.object
  } else if (typeof data.object === 'string') {
    // log cloud style exceptions
    data = JSON.parse(data.object)
  }

  const ip = ctx.ip
  const doc = { ip }
  for (const field in ctx.db.Log.schema.obj) {
    if (data[field]) {
      doc[field] = data[field]
      delete data[field]
    }
  }

  if (ctx.request.files) {
    const file = ctx.request.files.file

    if (file.partial) {
      ctx.body = {}
      return
    }

    const filename = file.name
    const storename = uuid()
    await fs.forceMove(file.path, path.join(config.storage, storename))

    doc.attachments = [{
      ip,
      filename,
      storename,
      size: file.size,
      uploadedAt: new Date()
    }]
  }

  doc.data = data

  await ctx.db.Log.saveAttachment(doc)

  ctx.body = { log_id: doc.log_id }
})

router.get('/exceptions', authLevel('reporter'), async ctx => {
  const params = validate(ctx.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string(),
    'ip[]': [Joi.string(), Joi.array().items(Joi.string())],
    'imei[]': [Joi.string(), Joi.array().items(Joi.string())],
    'sw_version[]': [Joi.string(), Joi.array().items(Joi.string())]
  })

  const option = {}
  constructQueryFilter(option, params['ip[]'], 'ip', true)
  constructQueryFilter(option, params['imei[]'], 'imei', true)
  constructQueryFilter(option, params['sw_version[]'], 'sw_version', true)

  const ips = await ctx.db.Log.distinct('ip', {ip: {$ne: null}})
  const imeis = await ctx.db.Log.distinct('imei', {imei: {$ne: null}})
  const versions = await ctx.db.Log.distinct('sw_version', {sw_version: {$ne: null}})

  let query = ctx.db.Log.find(option)
  query = appendQueryPaging(query, params.page, params.results)
  query = appendQuerySort(query, params.sortField, params.sortOrder)

  const totalCount = await ctx.db.Log.countDocuments(option)
  const results = await query.lean()

  results.forEach(e => {
    e.attachments.forEach(a => {
      a.url = url.format({
        protocol: ctx.protocol,
        host: ctx.host,
        pathname: '/log/files/' + e._id + '/' + a._id
      })
    })
  })

  ctx.body = {
    totalCount,
    results,
    ips,
    imeis,
    versions
  }
})

router.get('/files/:doc_id/:a_id', authLevel('reporter'), range, async ctx => {
  const doc = await ctx.db.Log.findById(ctx.params.doc_id)
  const a = doc ? doc.attachments.id(ctx.params.a_id) : null
  if (!a) {
    ctx.status = 400
    ctx.body = ''
    return
  }

  const filepath = path.join(config.storage, a.storename)
  ctx.attachment(a.filename)
  await send(ctx, filepath, {root: '/'})
})

module.exports = router
