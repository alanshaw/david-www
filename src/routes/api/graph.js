const errors = require('../helpers/errors')
const getDepsType = require('../helpers/get-deps-type')

module.exports = (app, graph, manifest) => {
  app.get('/:user/:repo/:ref?/graph.json', (req, res) => {
    sendDependencyGraph(req, res, {})
  })

  app.get('/:user/:repo/:ref?/dev-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {dev: true})
  })

  app.get('/:user/:repo/:ref?/peer-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {peer: true})
  })

  app.get('/:user/:repo/:ref?/optional-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {optional: true})
  })

  function sendDependencyGraph (req, res, opts) {
    req.session.get('session/access-token', (err, authToken) => {
      if (errors.happened(err, req, res, 'Failed to get session access token')) {
        return
      }

      manifest.getManifest(req.params.user, req.params.repo, req.query.path, req.params.ref, authToken, (err, manifest) => {
        if (errors.happened(err, req, res, 'Failed to get package.json')) {
          return
        }

        const depsType = getDepsType(opts)
        var deps

        if (depsType) {
          deps = manifest[depsType + 'Dependencies'] || {}
        } else {
          deps = manifest.dependencies || {}
        }

        var graphName = req.params.user + '/' + req.params.repo

        if (req.query.path && req.query.path[req.query.path.length - 1] === '/') {
          req.query.path = req.query.path.slice(0, -1)
        }

        if (req.query.path) {
          graphName += '/' + req.query.path
        }

        if (req.params.ref) {
          graphName += '/#' + req.params.ref
        }

        if (depsType) {
          graphName += '/' + depsType
        }

        graph.getProjectDependencyGraph(
          graphName,
          manifest.version,
          deps,
          (err, graph) => {
            if (errors.happened(err, req, res, 'Failed to get graph data')) {
              return
            }

            res.json(graph)
          })
      })
    })
  }
}
