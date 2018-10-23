'use strict'
const cluster = require('cluster')
const Sequelize = require('sequelize')
const config = require('../config').database
const logger = require('log4js').getLogger()

const defines = [
  require('./log'),
  require('./ota')
]

const db = {}
const sequelize = new Sequelize(config.database, config.username, config.password,
  {
    ...config,
    logging: sql => logger.info(sql)
  })

function importModels(defArray) {
  for (const def of defArray) {
    if (typeof def === 'function') {
      const model = def(sequelize, Sequelize.DataTypes)
      db[model.tableName] = model
    } else {
      importModels(def)
    }
  }
}

importModels(defines)

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
  sequelize.sync({logging: (log) => logger.info(log), force: false, alter: process.env.NODE_ENV === 'development'})
}

module.exports = db
