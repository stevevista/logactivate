'use strict'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
const path = require('path')
const {Koa, Static} = require('koa-app-server')
const koaBody = require('koa-body')
const router = require('./routes')
const db = require('./models')
const config = require('./config')

const logger = require('log4js').getLogger()

const app = new Koa()

// app.proxy = true
app.context.db = db

app.on('error', err => {
  if (err.ctx) {
    const ctx = err.ctx
    ctx.body = err.message
    if (ctx.status === 500) {
      logger.error(ctx.path, err.message)
    } else {
      if (ctx.status !== 401) {
        logger.warn(ctx.path, err.message)
      }
    }
  } else {
    logger.fatal('server error', err)
  }
})

app.use(koaBody())

app.use(router.routes())

app.use(Static('/', path.join(__dirname, '../public'), {gzip: true}))

if (config.websocket) {
  app.use(require('./websocket'))
}

app.start({
  port: config.port,
  ssl: config.ssl,
  cluster: config.cluster
}, info => {
  if (info.master) {
    logger.info(`http server on ${config.port}, on ${info.numCPUs} cpus`)
    console.log(`http server on ${config.port}, on ${info.numCPUs} cpus`)
    if (config.ssl) {
      console.log('https enabled')
    }
  }
})

module.exports = app
