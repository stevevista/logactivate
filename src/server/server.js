'use strict'
const http = require('http')
const path = require('path')
const express = require('express')
const cluster = require('cluster')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const logact = require('./logact')
const config = require('./config')
require('./models')

const {authToken} = require('./auth')

const logger = require('log4js').getLogger()

logact.configure({
  filename: path.join(config.logdir, config.exceptionFilename),
  maxLogSize: config.exceptionFilesize,
  backups: config.exceptionBackups
})

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieSession({
  name: 'session',
  secret: config.session.secrets,
  maxAge: config.session.maxAge
}))

app.use('/', express.static(path.join(__dirname, '../public'), {
  maxAge: '1d'
}))

app.use(authToken())
app.use(require('./routes'))

// handle errors
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({message: err.message})
  logger.fatal(req.path, err.message)
})

// handle 404
if (process.env.NODE_ENV === 'production') {
  app.use((req, res) => {
    res.status(404).json({message: 'not found'})
  })
}

const server = http.createServer(app)

if (config.cluster) {
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
} else {
  logger.info(`http server on ${config.port}, on single core mode`)
  console.log(`http server on ${config.port}, on single core mode`)
  server.listen(config.port)
}

module.exports = app
