'use strict'

module.exports = function (sequelize, DataTypes) {
  const Log = sequelize.define('log', {
    title: DataTypes.STRING(255)
  }, {
    tableName: 'log',
    freezeTableName: true,
    timestamps: false
  })

  return Log
}
