'use strict'
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: String,
  creator: String,
  level: Number,
  disabled: Boolean,
  lastLoginAt: Date
}, {
  timestamps: true
})

schema.pre('save', async function (next) {
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  await next()
})

for (const op of ['update', 'updateOne', 'updateMany', 'findOneAndUpdate']) {
  schema.pre(op, async function(next) {
    if ('password' in this._update) {
      this._update.password = await bcrypt.hash(this._update.password, 10)
    }
    await next()
  })
}

schema.methods.verify = async function(plain) {
  if (this.disabled) {
    return false
  }
  return bcrypt.compare(plain, this.password)
}

schema.statics.login = async function(username, password) {
  const user = await this.findOne({ username })
  if (!user || user.disabled) {
    return null
  }
  if (await bcrypt.compare(password, user.password)) {
    user.lastLoginAt = new Date()
    await user.save()
    return user
  } else {
    return null
  }
}

const User = mongoose.model('User', schema)

module.exports = [
  User
]
