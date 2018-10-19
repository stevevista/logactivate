'use strict'

const fileAppender = require('./file')
const LoggingEvent = require('./LoggingEvent')
const cluster = require('cluster')
const logger = require('log4js').getLogger()

const topic = '__logact:message'

// in a multi-process node environment, worker loggers will use
// process.send
const receiver = (worker, message) => {
  if (message && message.topic && message.topic === topic) {
    logger.debug('received message: ', message.data)
    const logEvent = LoggingEvent.deserialise(message.data)
    sendLogEventToAppender(logEvent)
  }
}

function clusteringInit () {
  // just in case configure is called after shutdown
  if (cluster.removeListener) {
    cluster.removeListener('message', receiver)
  }

  if (cluster.isMaster) {
    logger.debug('listening for cluster messages')
    cluster.on('message', receiver)
  }
}

const onlyOnMaster = (fn, notMaster) => (cluster.isMaster ? fn() : notMaster)
const clusteringSend = (msg) => {
  if (cluster.isMaster) {
    sendLogEventToAppender(msg)
  } else {
    msg.cluster = {
      workerId: cluster.worker.id,
      worker: process.pid
    }
    process.send({ topic, data: msg.serialise() })
  }
}

let appender

function sendLogEventToAppender (logEvent) {
  if (!appender) return
  appender(logEvent)
}

function configure (config) {
  clusteringInit()

  appender = onlyOnMaster(() => {
    return fileAppender(config)
  }, () => {})
}

function shutdown (cb) {
  appender.shutdown((err) => cb(err))
  appender = null
}

function log (level, ...args) {
  const loggingEvent = new LoggingEvent(level, args)
  clusteringSend(loggingEvent)
}

module.exports = {
  log,
  configure,
  shutdown
}
