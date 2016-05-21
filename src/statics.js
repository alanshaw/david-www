import Path from 'path'
import express from 'express'
import favicon from 'serve-favicon'

export default ({ app, version }) => {
  const oneDay = 86400000 // milliseconds: 60 * 60 * 24 * 1000
  const oneWeek = oneDay * 7
  const oneMonth = oneWeek * 30

  const publicPath = (folder) => Path.join(__dirname, '..', 'public', folder)

  app.use(`/bundle-${version}.css`, express.static(publicPath('bundle.css'), { maxAge: oneMonth }))
  app.use(`/bundle-${version}.js`, express.static(publicPath('bundle.js'), { maxAge: oneMonth }))
  app.use('/fonts', express.static(publicPath('fonts'), { maxAge: oneMonth }))
  app.use('/img', express.static(publicPath('img'), { maxAge: oneMonth }))

  app.use(favicon(publicPath('favicon.ico'), { maxAge: oneWeek }))

  app.get('/apple-touch-icon.png', (req, res) => {
    res.sendfile(Path.join(__dirname, 'dist', req.url), { maxAge: oneWeek })
  })
}
