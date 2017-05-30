import Boom from 'boom'

export default ({ app }) => {
  app.use((err, req, res, next) => {
    console.error(err)

    if (err.stack) {
      console.error(err.stack)
    }

    err = err.isBoom ? err : Boom.wrap(err)
    res.status(err.output.statusCode)

    // respond with html page
    if (req.accepts('html')) {
      // FIXME: Render HTML page
      return res.send(err.output.payload.message)
    }

    // respond with json
    if (req.accepts('json')) {
      return res.json(err.output.payload)
    }

    // default to plain-text. send()
    res.type('txt').send(err.output.payload.message)
  })
}
