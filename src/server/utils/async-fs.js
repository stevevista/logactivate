'use strict'
const fs = require('fs')
const path = require('path')

function rename (oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, async err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function copy (src, dest) {
  return new Promise(async (resolve, reject) => {
    const ws = fs.createWriteStream(dest, { encoding: null })
    const is = fs.createReadStream(src, { encoding: null })
    ws.on('error', reject)
    ws.on('close', resolve)
    is.on('error', reject)
    is.pipe(ws)
  })
}

async function forceMove(oldPath, newPath) {
  await mkdirp(path.dirname(newPath))
  try {
    await rename(oldPath, newPath)
  } catch (e) {
    // fallback to copy & delete
    await copy(oldPath, newPath)
    await unlink(oldPath)
  }
}

function unlink (path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function mkdirp(dir) {
  return new Promise((resolve, reject) => {
    fs.access(dir, null, (err) => {
      if (!err) {
        return resolve()
      }
      fs.mkdir(dir, {recursive: true}, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

module.exports = {
  rename,
  forceMove,
  copy,
  unlink,
  mkdirp
}
