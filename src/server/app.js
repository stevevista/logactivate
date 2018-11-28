'use strict'
const path = require('path')
const {Koa, Static, WebSocket} = require('koa-app-server')
const koaBody = require('koa-body')
const router = require('./routes')
const db = require('./models')
const logact = require('./logact')
const config = require('./config')

const logger = require('log4js').getLogger()

logact.configure({
  filename: path.join(config.logdir, config.exceptionFilename),
  maxLogSize: config.exceptionFilesize,
  backups: config.exceptionBackups
})

const app = new Koa()

// app.proxy = true
app.context.db = db

app.on('error', err => {
  logger.error('server error', err)
})

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    ctx.status = e.status || 500
    ctx.body = e.message
    if (ctx.status === 500) {
      logger.error(ctx.path, e.message)
    } else {
      if (ctx.status !== 401) {
        logger.warn(ctx.path, e.message)
      }
    }
  }
})

app.use(koaBody())

app
  .use(router.routes())
  .use(router.allowedMethods())

app.use(Static('/', path.join(__dirname, '../public'), {gzip: true}))

if (config.websocket) {
  app.use(WebSocket(require('./services/websocket').routes()))
}

app.start({
  port: config.port,
  ssl: config.sslOption,
  cluster: config.cluster
}, info => {
  if (info.master) {
    logger.info(`http server on ${config.port}, on ${info.numCPUs} cpus`)
    console.log(`http server on ${config.port}, on ${info.numCPUs} cpus`)
    if (config.sslOption) {
      console.log('https enabled')
    }
  }
})

module.exports = app
