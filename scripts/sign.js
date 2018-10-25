const {signToken} = require('../src/server/auth')
const bcrypt = require('bcrypt')

const obj = {}
let plainPassword
let compareHash

for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg === '--hash') {
    plainPassword = process.argv[i + 1]
    break
  }

  if (arg === '--check') {
    plainPassword = process.argv[i + 1]
    compareHash = process.argv[i + 2]
    break
  }
  
  if (arg.indexOf('--') === 0) {
    const key = arg.slice(2)
    const val = process.argv[i + 1]
    i++
    obj[key] = val
  }
}

if (plainPassword) {
  if (compareHash) {
    bcrypt.compare(plainPassword, compareHash)
      .then(res => {
        console.log(res)
      })
  } else {
    bcrypt.hash(plainPassword, 10)
      .then(hash => {
        console.log('plain: ', plainPassword)
        console.log(hash)
      })
  }
} else {
  const token = signToken(obj)
  console.log(obj)
  console.log(token)
}

