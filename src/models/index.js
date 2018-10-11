'use strict'
const fs = require('fs')
const path = require('path')
const cluster = require('cluster')
const Sequelize = require('sequelize')
const config = require('../config').database

const logger = require('log4js').getLogger()

const sequelize = new Sequelize(config.database, config.username, config.password,
  {
    ...config,
    logging: sql => logger.info(sql)
  })

const db = {}

fs.readdirSync(__dirname).forEach(file => {
  if (file !== 'index.js') {
    const model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  }
})

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

async function initDb () {
  try {
    await db.log.findOne()
    return
  } catch (e) {
    // not initilized
  }

  await sequelize.sync({logging: (log) => logger.info(log), force: false})
}

if (cluster.isMaster) {
  initDb()
}

module.exports = db
