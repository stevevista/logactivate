'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')

function requireJs (path) {
  const content = fs.readFileSync(path)
  return JSON.parse(content)
}

const configDir = path.join(__dirname, '..', 'config')
let config = requireJs(path.join(configDir, 'config.json'))
const envConfig = path.join(configDir, 'config.' + process.env.NODE_ENV + '.json')
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

module.exports = config
