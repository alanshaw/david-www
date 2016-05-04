module.exports = (app, changelog) => {
  app.get('/package/:pkg/changes.json', (req, res) => {
    changelog.getChanges(req.params.pkg, req.query.from, req.query.to, (err, changes) => {
      if (err) {
        console.warn(err)
        return res.status(500).send({error: 'Failed to get changes'})
      }
      res.send(changes)
    })
  })
}
