'use strict'
const config = require('../config')
const path = require('path')
const url = require('url')

function Log(sequelize, DataTypes) {
  const db = sequelize.define('log', {
    ip: DataTypes.STRING(128),
    imei: DataTypes.STRING(32),
    sn: DataTypes.STRING(64),
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    swVersion: DataTypes.STRING(128),
    hwVersion: DataTypes.STRING(128),
    bbVersion: DataTypes.STRING(128),
    data: DataTypes.TEXT
  }, {
    tableName: 'log',
    freezeTableName: true,
    timestamps: true
  })

  return db
}

function Files(sequelize, DataTypes) {
  const db = sequelize.define('log_files', {
    ip: DataTypes.STRING(128),
    imei: DataTypes.STRING(32),
    filename: DataTypes.STRING(128)
  }, {
    tableName: 'log_files',
    freezeTableName: true,
    timestamps: true
  })

  db.prototype.storePath = function() {
    return path.join(config.ota.logdir, this.imei, this.filename)
  }

  db.prototype.fullDownloadURI = function(req) {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: '/log/download/' + this.imei + '/' + this.filename
    })
  }

  return db
}

module.exports = [
  Log,
  Files
]
