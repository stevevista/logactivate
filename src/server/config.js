'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')
const cluster = require('cluster')
const log4js = require('log4js')

function requireJs (path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
}

const configDir = path.join(process.cwd(), 'config')
const basConfigPath = path.join(configDir, 'base.yml')
const envConfigPath = path.join(configDir, process.env.NODE_ENV + '.yml')

if (!fs.existsSync(basConfigPath)) {
  console.error(`Missing config file: ${basConfigPath}`)
  process.exit(1)
}

let config = requireJs(basConfigPath)
if (fs.existsSync(envConfigPath)) {
  config = _.merge(config, requireJs(envConfigPath))
}

// fix default values
if (!config.logdir) {
  config.logdir = 'storage'
}

if (!config.exceptionFilename) {
  config.exceptionFilename = 'exceptions.log'
}

if (!config.exceptionFilename) {
  config.exceptionFilesize = '1M'
}

if (config.database.storage && config.database.storage[0] !== '/') {
  config.database.storage = path.join(config.logdir, config.database.storage)
}

// app log configuration
const logConfig = {
  appenders: {
    console: {
      type: 'console'
    },
    trace: {
      type: 'file',
      filename: config.appLogFilename,
      maxLogSize: config.appLogSize
    }
  },
  categories: {
    default: {
      appenders: ['console', 'trace'],
      level: config.appLogLevel
    }
  }
}

// init logger
log4js.configure(logConfig)

// init storage
if (cluster.isMaster) {
  if (!fs.existsSync(config.logdir)) {
    try {
      fs.mkdirSync(config.logdir)
    } catch (e) {
      console.error('cannot initialize storage', e.message)
      process.exit(1)
    }
  }
}

module.exports = config
