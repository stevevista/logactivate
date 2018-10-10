const express = require('express')
const hugo = require('./hugo')

const app = express()

app.use(hugo())

app.listen(3000, () => {
  console.log(`Server listening on port 3000`)
})
