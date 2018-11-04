'use strict'
const Router = require('koa-router')
const koaBody = require('koa-body')
const range = require('koa-range')
const Joi = require('joi')
const Sequelize = require('sequelize')
const path = require('path')
const send = require('koa-send')
const {validate} = require('../utils/validate')
const fs = require('../utils/async-fs')
const logact = require('../logact')
const {constructQuerySort, constructQueryFilter} = require('../utils/dbhelper')
const {authLevel} = require('../auth')
const config = require('../config')

const router = Router()

router.get('/', ctx => {
  ctx.body = 'Hello LogActivate!'
})

const ObjectAttrs = [
  ['imei', 'imei', ''],
  ['sn', 'sn', ''],
  ['latitude', 'latitude', 0.0],
  ['longitude', 'longitude', 0.0],
  ['swVersion', 'sw_version', ''],
  ['hwVersion', 'hw_version', ''],
  ['bbVersion', 'bb_version', '']
]

router.post('/report', async ctx => {
  let data = ctx.request.body
  if (typeof data.object === 'object') {
    // log cloud style exceptions
    data = data.object
  } else if (typeof data.object === 'string') {
    // log cloud style exceptions
    try {
      data = JSON.parse(data.object)
    } catch (e) {
      // pass
    }
  }

  const props = {
    ip: ctx.ip
  }
  for (const attr of ObjectAttrs) {
    props[attr[0]] = data[attr[1]] || attr[2]
    delete data[attr[1]]
  }

  props.data = JSON.stringify(data)
  await ctx.db.log.create(props)

  logact.log('exception', props)
  
  ctx.body = {}
})

function fileTrunkPath(imei, filename, trunks) {
  return path.join(config.tmpdir, `${imei}.${filename}.${trunks}`)
}

router.post('/upload', koaBody({
  multipart: true,
  formidable: {
    uploadDir: config.tmpdir
  }
}), async ctx => {
  const params = validate(ctx.request.body, {
    imei: Joi.string().alphanum().required(),
    trunks: Joi.number().integer().min(1),
    eot: Joi.number().integer()
  })

  const file = ctx.request.files.file
  const ip = ctx.ip
  const dest = ctx.db.log_files.constructStorePath(params.imei, file.name)

  const trunkFiles = []

  if (params.trunks) {
    if (!params.eot) {
      // don't move to dest yet
      await fs.rename(file.path, fileTrunkPath(params.imei, file.name, params.trunks))
      ctx.body = {}
      return
    } else {
      for (let i = 1; i < params.trunks; i++) {
        trunkFiles.push(fileTrunkPath(params.imei, file.name, i))
      }
      trunkFiles.push(file.path)

      await fs.makeSureFileDir(dest)
      await fs.copy(trunkFiles, dest)
    }
  } else {
    await fs.forceMove(file.path, dest)
  }

  await ctx.db.log_files.create({
    ip,
    imei: params.imei,
    filename: file.name
  })
  ctx.body = {}

  // remove trunks after response to user
  for (const f of trunkFiles) {
    await fs.unlink(f)
  }
})

router.get('/exceptions', authLevel('reporter'), async ctx => {
  const params = validate(ctx.query, {
    results: Joi.number().integer().default(20),
    page: Joi.number().integer().default(1),
    sortField: Joi.string(),
    sortOrder: Joi.string(),
    'ip[]': [Joi.string(), Joi.array().items(Joi.string())],
    'imei[]': [Joi.string(), Joi.array().items(Joi.string())],
    'swVersion[]': [Joi.string(), Joi.array().items(Joi.string())]
  })

  const offset = (params.page - 1) * params.results
  const option = {
    limit: params.results,
    offset
  }

  constructQuerySort(option, params.sortField, params.sortOrder)
  constructQueryFilter(option, params['ip[]'], 'ip', true)
  constructQueryFilter(option, params['imei[]'], 'imei', true)
  constructQueryFilter(option, params['swVersion[]'], 'swVersion', true)

  const ips = await ctx.db.log.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('ip')), 'ip']]
  })
  const imeis = await ctx.db.log.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('imei')), 'imei']]
  })
  const versions = await ctx.db.log.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('swVersion')), 'swVersion']]
  })
  const out = await ctx.db.log.findAndCountAll(option)
  
  ctx.body = {
    totalCount: out.count,
    results: out.rows,
    ips: ips.map(r => r.ip).filter(r => r !== ''),
    imeis: imeis.map(r => r.imei).filter(r => r !== ''),
    versions: versions.map(r => r.swVersion).filter(r => r !== '')
  }
})

router.get('/files/:imei', authLevel('reporter'), async ctx => {
  const out = await ctx.db.log_files.findAll({
    where: {imei: ctx.params.imei}
  })
  const results = out.map(r => ({
    id: r.id,
    filename: r.filename,
    url: r.fullDownloadURI(ctx)
  }))
  ctx.body = results
})

router.get('/download/:imei/:log', authLevel('reporter'), range, async ctx => {
  const filepath = ctx.db.log_files.constructStorePath(ctx.params.imei, ctx.params.log)
  ctx.attachment(ctx.params.log)
  await send(ctx, filepath, {root: '/'})
})

module.exports = router
