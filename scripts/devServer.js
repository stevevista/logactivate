process.env.NODE_ENV = 'development'

const webpack = require('webpack')
const rendererConfig = require('../webpack.config')

for (const k in rendererConfig.entry) {
  rendererConfig.entry[k] = ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'].concat([rendererConfig.entry[k]])
}

const app = require('../src/server/server')

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
