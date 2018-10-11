'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const configDir = path.join(__dirname, '..', 'config')
let config = require(path.join(configDir, 'config.json'))
const envConfig = path.join(configDir, 'config.' + process.env.NODE_ENV + '.json')
if (fs.existsSync(envConfig)) {
  config = _.merge(config, require(envConfig))
}

module.exports = config
