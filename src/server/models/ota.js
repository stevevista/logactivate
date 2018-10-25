const config = require('../config')
const path = require('path')
const url = require('url')

function packages(sequelize, DataTypes) {
  const db = sequelize.define('ota_packages', {
    name: DataTypes.STRING(128),
    version: DataTypes.STRING(128),
    applyTo: DataTypes.STRING(1024),
    filename: DataTypes.STRING(128),
    description: DataTypes.STRING(1024)
  }, {
    tableName: 'ota_packages',
    freezeTableName: true,
    timestamps: true
  })

  db.constructStorePath = function (filename) {
    return path.join(config.ota.firmwareDir, filename)
  }

  db.prototype.storePath = function() {
    return db.constructStorePath(this.filename)
  }

  db.prototype.fullDownloadURI = function(req) {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: '/ota/download/' + this.filename
    })
  }

  return db
}

module.exports = [
  packages
]
