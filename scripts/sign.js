const {signToken} = require('../src/server/auth')

const obj = {}
const opt = []

for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i]

  if (arg.indexOf('--') === 0) {
    const key = arg.slice(2)
    const val = process.argv[i + 1]
    i++
    obj[key] = val
  }
}

if ('level' in obj) {
  obj.level = +obj.level
}

if ('max-age' in obj) {
  opt.maxAge = obj['max-age']
  delete obj['max-age']
}

const token = signToken(obj, null, opt)
console.log(obj)
console.log(token)
