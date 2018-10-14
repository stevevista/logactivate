'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')

function requireJs (path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
}

const configDir = path.join(__dirname, '..', 'config')
let config = requireJs(path.join(configDir, 'base.yml'))
const envConfig = path.join(configDir, process.env.NODE_ENV + '.yml')
if (fs.existsSync(envConfig)) {
  config = _.merge(config, requireJs(envConfig))
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
const log = {
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

config.log = log

module.exports = config
