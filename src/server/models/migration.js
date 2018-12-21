'use strict'
const config = require('../config')
const logger = require('log4js').getLogger()

async function migrate(db) {
  await initializeDb(db)
}

async function initializeDb(db) {
  logger.info('db initializing...')
  const userCount = await db.User.countDocuments()
  if (userCount === 0) {
    await db.User.create({
      username: config.sysadmin.username,
      password: config.sysadmin.password,
      level: 0
    })
  }

  const devCount = await db.Device.countDocuments()
  if (devCount === 0) {
    await db.Device.create({
      productKey: 'testProduct',
      deviceName: 'testDevice',
      deviceSecret: '12345678'
    })

    await db.Device.create({
      productKey: 'a11vWRALINU',
      deviceName: 'AvQKEXmnxyrOc20vmZZB',
      deviceSecret: 'GTpahEdeOE4r1W3unpz3tF2Q3LA6Cx0r',
      brokerUrl: 'mqtt://a11vWRALINU.iot-as-mqtt.cn-shanghai.aliyuncs.com'
    })
  }
}

module.exports = migrate
