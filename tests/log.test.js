const request = require('supertest')
const Koa = require('koa')
const koaBody = require('koa-body')
const fs = require('fs')

// fix _.merge issue in jest
const config = require('../dist/config')
config.database.dialect = 'sqlite'

const db = require('../dist/models')
const log = require('../dist/lib/routes/log')
const logact = require('../dist/lib/logact')

console.log(db.log_files)

const initApp = () => {
  logact.configure({
    filename: './storage/test_logcat.log',
    maxLogSize: '1M'
  })

  const app = new Koa()
  app.context.db = db
  app.use(koaBody())
  app
  .use(log.routes())
  .use(log.allowedMethods())
  return app
}

/*
describe('xxx', () => {
  test('It should fetch HugoDF from GitHub', async () => {
    const app = initApp()
    const res = await request(app.listen()).post('/report')
    .send({name: 'john'})
  })
})

describe('upload log file', () => {
  test('should store file in local', async () => {
    const app = initApp()
    await request(app.listen()).post('/upload')
      .field('imei', '11332244555')
      .attach('file', './tests/boost_1_65_1.tar.bz2')
      .expect(200)

    expect(fs.existsSync('./storage/11332244555/boost_1_65_1.tar.bz2')).toEqual(true)
  })

  test('should fail without file', async () => {
    const app = initApp()
    await request(app.listen()).post('/upload')
      .field('imei', '11332244555')
      .expect(500)
  })
})
*/