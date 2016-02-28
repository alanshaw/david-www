var path = require('path')
var express = require('express')
var favicon = require('serve-favicon')

var oneDay = 86400000 // milliseconds: 60 * 60 * 24 * 1000
var oneWeek = oneDay * 7
var oneMonth = oneWeek * 30

module.exports = function (app) {
  app.use('/css', express.static(path.join(__dirname, 'dist', 'css'), { maxAge: oneMonth }))
  app.use('/fonts', express.static(path.join(__dirname, 'dist', 'fonts'), { maxAge: oneMonth }))
  app.use('/img', express.static(path.join(__dirname, 'dist', 'img'), { maxAge: oneMonth }))
  app.use('/js', express.static(path.join(__dirname, 'dist', 'js'), { maxAge: oneMonth }))

  app.use(favicon(path.join(__dirname, 'dist', 'favicon.ico'), { maxAge: oneWeek }))

  app.get('/apple-touch-icon.png', function (req, res) {
    res.sendfile(path.join(__dirname, 'dist', req.url), { maxAge: oneWeek })
  })
}
