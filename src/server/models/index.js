'use strict'
const cluster = require('cluster')
const Sequelize = require('sequelize')
const config = require('../config')
const logger = require('log4js').getLogger()

const defines = [
  require('./log'),
  require('./ota'),
  require('./user')
]

const db = {}
const cfg = config.database
const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password,
  {
    ...cfg,
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

async function initializeDb() {
  await sequelize.sync({logging: (log) => logger.info(log), force: false, alter: false})
  logger.info('db initialized!')
  const userCount = await db.users.count()
  if (userCount === 0) {
    await db.users.createEx({
      username: config.sysadmin.username,
      password: config.sysadmin.password,
      level: 0
    })
  }
}

if (cluster.isMaster) {
  initializeDb()
}

module.exports = db
