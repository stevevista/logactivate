'use strict'

process.env.NODE_ENV = 'production'
const chalk = require('chalk')
const webpack = require('webpack')

const rendererConfig = require('../webpack.config')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '

function onError(err) {
  console.log(`\n  ${errorLog}failed to build web process`)
  console.error(`\n${err}\n`)
  process.exit(1)
}

webpack(rendererConfig, (err, stats) => {
  if (err) {
    onError(err)
  }
  else if (stats.hasErrors()) {
    let err = ''

    stats.toString({
      chunks: false,
      colors: true
    })
    .split(/\r?\n/)
    .forEach(line => {
      err += `    ${line}\n`
    })

    onError(err)
  } else {
    let results = stats.toString({
      chunks: false,
      colors: true
    })
    results += results + '\n\n'
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}\n`)
    process.exit()
  }
})
