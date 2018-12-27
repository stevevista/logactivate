'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')
const cluster = require('cluster')
const log4js = require('log4js')
const ms = require('ms')

let workDir = process.cwd()
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--work-dir') {
    workDir = process.argv[i + 1]
    break
  }
}

function requireJs (path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
}

const configDir = path.join(workDir, 'config')
const basConfigPath = path.join(configDir, 'base.yml')
const envConfigPath = path.join(configDir, process.env.NODE_ENV + '.yml')

let config = {
  configDir,
  storage: 'storage',
  tmpdir: 'tmp', 
  //ssl: {
  //  dir: 'ssl',
  //  port: 443
  //},
  mqtt: {
    brokerUrl: 'mqtt://localhost'
  },
  session: {
    maxAge: '24h'
  },
  dbUrl: 'mongodb://localhost/logactivate',
  appLogFilename: 'logactivate.log',
  maxUploadFileSize: 200 * 1024 * 1024
}

if (!fs.existsSync(basConfigPath)) {
  console.error(`Missing config file: ${basConfigPath}`)
  process.exit(1)
}

config = _.merge(config, requireJs(basConfigPath))
if (fs.existsSync(envConfigPath)) {
  config = _.merge(config, requireJs(envConfigPath))
}

function _resolveObjectAttribute(cfg, attr, transform) {
  const val = cfg[attr[0]]
  if (attr.length > 1) {
    if (typeof val !== 'object') {
      return
    }
    _resolveObjectAttribute(val, attr.slice(1), transform)
  } else {
    transform(cfg, attr[0])
  }
}

function resolveConfigPath(basedir, cfg, attributes) {
  for (const attr of attributes) {
    _resolveObjectAttribute(cfg, attr.split('.'), (obj, a) => {
      if (typeof obj[a] === 'string') {
        obj[a] = path.resolve(basedir, obj[a])
      }
    })
  }
}

function resolveConfigMsTime(cfg, attributes) {
  for (const attr of attributes) {
    _resolveObjectAttribute(cfg, attr.split('.'), (obj, a) => {
      if (typeof obj[a] === 'string') {
        obj[a] = ms(obj[a])
      }
    })
  }
}

resolveConfigPath(workDir, config, [
  'storage',
  'tmpdir',
  'ssl.dir',
  'appLogFilename'
])

resolveConfigMsTime(config, [
  'session.maxAge'
])

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
  if (!fs.existsSync(config.storage)) {
    try {
      fs.mkdirSync(config.storage)
    } catch (e) {
      console.error('cannot initialize storage', e.message)
      process.exit(1)
    }
  }

  if (!fs.existsSync(config.tmpdir)) {
    try {
      fs.mkdirSync(config.tmpdir)
    } catch (e) {
      console.error('cannot initialize tmpdir', e.message)
      process.exit(1)
    }
  }
}

module.exports = config
