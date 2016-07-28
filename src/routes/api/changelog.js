import Boom from 'boom'

export default (app, changelog) => {
  app.get('/package/:pkg/changes.json', (req, res, next) => {
    changelog.getChanges(req.params.pkg, req.query.from, req.query.to, (err, changes) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get changes'))
      res.send(changes)
    })
  })
}
