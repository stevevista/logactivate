'use strict'
const fs = require('fs')
const path = require('path')

async function mkdir (path, options) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function access (path, mode) {
  return new Promise((resolve, reject) => {
    fs.access(path, mode, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

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

async function forceMove(oldPath, newPath) {
  await makeSureFileDir(newPath)
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

async function makeSureDir(dir) {
  const exists = await access(dir)
  if (!exists) {
    await mkdir(dir, {recursive: true})
  }
}

function makeSureFileDir(fullpath) {
  return makeSureDir(path.dirname(fullpath))
}

module.exports = {
  access,
  mkdir,
  rename,
  forceMove,
  unlink,
  makeSureDir,
  makeSureFileDir
}
