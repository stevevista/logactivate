'use strict'
const bcrypt = require('bcrypt')

function users(sequelize, DataTypes) {
  const db = sequelize.define('users', {
    username: {type: DataTypes.STRING(32), unique: true, allowNull: false},
    password: DataTypes.STRING(100),
    creator: DataTypes.STRING(32),
    level: {type: DataTypes.INTEGER, allowNull: false},
    disabled: DataTypes.BOOLEAN
  }, {
    tableName: 'users',
    freezeTableName: true,
    timestamps: true
  })

  db.prototype.checkPassword = function(plain) {
    return bcrypt.compare(plain, this.password)
  }

  db.hashPassword = function(password) {
    return bcrypt.hash(password, 10)
  }

  db.createEx = async function (fields) {
    if ('password' in fields) {
      fields.password = await db.hashPassword(fields.password)
    }
    await db.create(fields)
  }

  db.updateEx = async function (fields, option) {
    if ('password' in fields) {
      fields.password = await db.hashPassword(fields.password)
    }
    await db.update(fields, option)
  }

  return db
}

module.exports = [
  users
]
