'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')
const cluster = require('cluster')
const log4js = require('log4js')

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
  logdir: 'storage',
  tmpdir: 'tmp',
  session: {
    maxAge: 24 * 60 * 60 * 1000
  }
}

if (!fs.existsSync(basConfigPath)) {
  console.error(`Missing config file: ${basConfigPath}`)
  process.exit(1)
}

config = _.merge(config, requireJs(basConfigPath))
if (fs.existsSync(envConfigPath)) {
  config = _.merge(config, requireJs(envConfigPath))
}

if (config.logdir[0] !== '/') {
  config.logdir = path.join(workDir, config.logdir)
}

function resolvePath (obj, key, basedir) {
  if (obj && key in obj) {
    if (obj[key][0] !== '/') {
      obj[key] = path.join(basedir, obj[key])
    }
  }
}

resolvePath(config.database, 'storage', workDir)
resolvePath(config.ota, 'firmwareDir', workDir)
resolvePath(config, 'appLogFilename', workDir)
resolvePath(config, 'tmpdir', workDir)

// default log option
if (!config.exceptionFilename) {
  config.exceptionFilename = 'exceptions.log'
}

if (!config.exceptionFilename) {
  config.exceptionFilesize = '1M'
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
