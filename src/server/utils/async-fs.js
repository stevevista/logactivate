
const fs = require('fs')

async function mkdir (path, options) {
  let check = false
  if (options && 'check' in options) {
    check = options['check']
    delete options['check']
  }

  if (check) {
    const exists = await access(path)
    if (exists) {
      return
    }
  }
  
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
        reject(err)
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
    fs.rename(oldPath, newPath, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function copy (src, dest) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(dest)
    ws.on('error', err => reject(err))
    ws.on('close', () => resolve())

    if (typeof src === 'string') {
      src = [src]
    }

    for (const p of src) {
      const is = fs.createReadStream(p)
      is.pipe(ws)
      is.on('error', err => reject(err))
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

module.exports = {
  access,
  stat,
  mkdir,
  writeFile,
  rename,
  copy,
  unlink
}
