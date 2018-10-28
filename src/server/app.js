'use strict'
const http = require('http')
const https = require('https')
const path = require('path')
const cluster = require('cluster')
const Koa = require('koa')
const koaBody = require('koa-body')
const router = require('./routes')
const db = require('./models')
const serveStatic = require('./static')
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
  console.error('server error', err)
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

app.use(serveStatic('/', path.join(__dirname, '../public'), {gzip: true}))

const server = http.createServer(app.callback())

if (config.cluster) {
  const numCPUs = require('os').cpus().length

  if (cluster.isMaster) {
    logger.info(`http server on ${config.port}, on ${numCPUs} cores`)
    console.log(`http server on ${config.port}, on ${numCPUs} cores`)
    if (config.sslOption) {
      console.log('https enabled')
    }
  
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }
  
    cluster.on('listening', (worker, address) => {
      logger.debug(`start core: ${worker.id}`)
    })
  
    cluster.on('exit', (worker, code, signal) => {
      console.log(signal)
      logger.warn(`reboot core: ${worker.id}`)
      setTimeout(() => cluster.fork(), 2000)
    })
  } else {
    server.listen(config.port)
    if (config.sslOption) {
      https.createServer(config.sslOption, app.callback()).listen(443)
    }
  }  
} else {
  logger.info(`http server on ${config.port}, on single core mode`)
  console.log(`http server on ${config.port}, on single core mode`)
  if (config.sslOption) {
    console.log('https enabled')
  }
  server.listen(config.port)
  if (config.sslOption) {
    https.createServer(config.sslOption, app.callback()).listen(443)
  }
}

module.exports = app
