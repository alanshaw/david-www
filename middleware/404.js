module.exports = (app) => {
  app.use((req, res) => {
    res.status(404)

    // respond with html page
    if (req.accepts('html')) {
      return res.render('404')
    }

    // respond with json
    if (req.accepts('json')) {
      return res.send({error: 'Not found'})
    }

    // default to plain-text. send()
    res.type('txt').send('Not found')
  })
}
