'use strict'
const log4js = require('log4js')
const http = require('http')
const fs = require('fs')
const path = require('path')
const express = require('express')
const cluster = require('cluster')
const bodyParser = require('body-parser')

const logact = require('./logact')
const config = require('./config')

log4js.configure(config.log)
const logger = log4js.getLogger()

if (cluster.isMaster) {
  if (!fs.existsSync(config.logdir)) {
    try {
      fs.mkdirSync(config.logdir)
    } catch (e) {
      logger.fatal(e.message)
    }
  }
}

logact.configure({
  filename: path.join(config.logdir, config.exceptionFilename),
  maxLogSize: config.exceptionFilesize,
  backups: config.exceptionBackups
})

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(require('./routes'))

const server = http.createServer(app)

const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  logger.info(`http server on ${config.port}, on ${numCPUs} cores`)
  console.log(`http server on ${config.port}, on ${numCPUs} cores`)

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
}
