process.env.NODE_ENV = 'development'

let notCompileWeb = false
for (const arg of process.argv) {
  if (arg === '--no-web') {
    notCompileWeb = true
    break
  }
}

const webpack = require('webpack')
const rendererConfig = require('../webpack.config')

const app = require('../src/server/server')

if (!notCompileWeb) {
  for (const k in rendererConfig.entry) {
    rendererConfig.entry[k] = ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'].concat([rendererConfig.entry[k]])
  }

  // Step 1: Create & configure a webpack compiler
  const compiler = webpack(rendererConfig)

  // Step 2: Attach the dev middleware to the compiler & the server
  app.use(require('webpack-dev-middleware')(compiler, {
    logLevel: 'warn', publicPath: rendererConfig.output.publicPath
  }))

      // Step 3: Attach the hot middleware to the compiler & the server
  app.use(require("webpack-hot-middleware")(compiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }))
}
