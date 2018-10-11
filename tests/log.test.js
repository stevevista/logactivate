const request = require('supertest')
const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const log = require('../dist/routes/log')

const initApp = () => {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(log)
  return app
}

describe('xxx', () => {
  test('It should fetch HugoDF from GitHub', async () => {
    const app = initApp()
    const res = await request(app).post('/report')
    .send({name: 'john'})
  })
})

describe('upload log file', () => {
  test('should store file in local', async () => {
    const app = initApp()
    await request(app).post('/upload')
      .field('imei', '11332244555')
      .attach('file', './tests/bigfile.pdf')
      .expect(200)

    expect(fs.existsSync('./11332244555_output.pdf')).toEqual(true)
  })

  test('should fail without file', async () => {
    const app = initApp()
    await request(app).post('/upload')
      .field('imei', '11332244555')
      .expect(500)
  })

})
