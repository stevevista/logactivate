'use strict'
const cluster = require('cluster')
const Sequelize = require('sequelize')
const config = require('../config').database
const defineLog = require('./log')
const logger = require('log4js').getLogger()

const sequelize = new Sequelize(config.database, config.username, config.password,
  {
    ...config,
    logging: sql => logger.info(sql)
  })

const db = {
  'log': defineLog(sequelize, Sequelize.DataTypes)
}

Object.keys(db).forEach(modelName => {
  const model = db[modelName]
  sequelize.importCache[modelName] = model
  if ('associate' in model) {
    model.associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

if (cluster.isMaster) {
  sequelize.sync({logging: (log) => logger.info(log), force: false})
}

module.exports = db
