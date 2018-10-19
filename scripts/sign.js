const {signToken} = require('../src/server/auth')

const obj = {}
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg.indexOf('--') === 0) {
    const key = arg.slice(2)
    const val = process.argv[i + 1]
    i++
    obj[key] = val
  }
}

const token = signToken(obj)
console.log(obj)
console.log(token)
