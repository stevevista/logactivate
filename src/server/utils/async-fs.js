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

function writeFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function stat (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(null)
      } else {
        resolve(stats)
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

async function copy (src, dest) {
  return new Promise(async (resolve, reject) => {
    const ws = fs.createWriteStream(dest, { encoding: null })
    ws.on('error', reject)
    ws.on('close', resolve)

    if (typeof src === 'string') {
      const is = fs.createReadStream(src, { encoding: null })
      is.on('error', reject)
      is.pipe(ws)
    } else {
      for (const f of src) {
        const is = fs.createReadStream(f, { encoding: null })
        is.on('error', reject)
        is.pipe(ws, {end: false})
        await new Promise((resolve) => {
          is.on('end', resolve)
        })
      }
      ws.close()
    }
  })
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
  stat,
  mkdir,
  writeFile,
  rename,
  forceMove,
  copy,
  unlink,
  makeSureDir,
  makeSureFileDir
}
