'use strict'

function AuthError(text) {
  const err = new Error(text)
  err.status = 401
  return err
}

function assert(expr, err, status) {
  if (!expr) {
    if (typeof err === 'string') {
      err = new Error(err)
    }
    if (typeof status === 'number') {
      err.status = status
    }
    throw err
  }
}

module.exports = {
  AuthError,
  assert
}
