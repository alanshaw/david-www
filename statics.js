const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')

module.exports = (app) => {
  const oneDay = 86400000 // milliseconds: 60 * 60 * 24 * 1000
  const oneWeek = oneDay * 7
  const oneMonth = oneWeek * 30

  const distPath = (folder) => path.join(__dirname, 'dist', folder)

  app.use('/css', express.static(distPath('css'), { maxAge: oneMonth }))
  app.use('/fonts', express.static(distPath('fonts'), { maxAge: oneMonth }))
  app.use('/img', express.static(distPath('img'), { maxAge: oneMonth }))
  app.use('/js', express.static(distPath('js'), { maxAge: oneMonth }))

  app.use(favicon(distPath('favicon.ico'), { maxAge: oneWeek }))

  app.get('/apple-touch-icon.png', (req, res) => {
    res.sendfile(path.join(__dirname, 'dist', req.url), { maxAge: oneWeek })
  })
}
