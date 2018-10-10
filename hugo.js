const { Router } = require('express')
const multer = require('multer')
const upload = multer()

module.exports = (router = new Router()) => {
  router.get('/hugo', (req, res) => {
    res.json({
      text: 'hello'
    })
  });

  router.post('/hugo', upload.single('file'), (req, res) => {
    console.log(req.body, req.file.toString())
  })

  return router
}
