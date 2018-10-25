'use strict'
const bcrypt = require('bcrypt')

function users(sequelize, DataTypes) {
  const db = sequelize.define('users', {
    username: {type: DataTypes.STRING(32), unique: true, allowNull: false},
    password: DataTypes.STRING(100),
    creator: DataTypes.STRING(32),
    level: {type: DataTypes.INTEGER, allowNull: false}
  }, {
    tableName: 'users',
    freezeTableName: true,
    timestamps: true
  })

  db.prototype.checkPassword = function(plain) {
    return bcrypt.compare(plain, this.password)
  }

  return db
}

module.exports = [
  users
]
