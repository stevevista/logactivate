const fs = require('fs')
const path = require('path')
const { Router } = require('express')

const router = Router()

fs.readdirSync(__dirname).forEach(file => {
  if (file !== 'index.js') {
    const subpath = file.replace(/(\.\/|\.js)/g, '')
    const fullpath = path.join(__dirname, subpath)
    router.use('/' + subpath, require(fullpath))
  }
})

module.exports = router
