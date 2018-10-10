const hugo = require('./hugo')
const express = require('express')
//const moxios = require('moxios')
const request = require('supertest')

const initHugo = () => {
  const app = express()
  app.use(hugo())
  return app;
}

describe('GET /hugo', () => {
  test('It should fetch HugoDF from GitHub', async () => {
    const app = initHugo()
    const res = await request(app).post('/hugo')
      .field('imei', '113322')
      .attach('file', './server.js')
      .catch(err => console.log(err))
    console.log(res.status)
  })
})
