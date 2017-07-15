import Boom from 'boom'
import getDepsType from '../helpers/get-deps-type'

export default (app, graph, manifest) => {
  app.get('/r/:remote/:user/:repo/:ref?/graph.json', (req, res) => {
    sendDependencyGraph(req, res, {driver: req.params.remote})
  })

  app.get('/r/:remote/:user/:repo/:ref?/dev-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {driver: req.params.remote, dev: true})
  })

  app.get('/r/:remote/:user/:repo/:ref?/peer-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {driver: req.params.remote, peer: true})
  })

  app.get('/r/:remote/:user/:repo/:ref?/optional-graph.json', (req, res) => {
    sendDependencyGraph(req, res, {driver: req.params.remote, optional: true})
  })

  app.get('/:user/:repo/:ref?/graph.json', (req, res, next) => {
    sendDependencyGraph(req, res, next, {})
  })

  app.get('/:user/:repo/:ref?/dev-graph.json', (req, res, next) => {
    sendDependencyGraph(req, res, next, {dev: true})
  })

  app.get('/:user/:repo/:ref?/peer-graph.json', (req, res, next) => {
    sendDependencyGraph(req, res, next, {peer: true})
  })

  app.get('/:user/:repo/:ref?/optional-graph.json', (req, res, next) => {
    sendDependencyGraph(req, res, next, {optional: true})
  })

  function sendDependencyGraph (req, res, next, opts) {
    req.session.get('session/access-token', (err, authToken) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get session access token'))

      const { user, repo, ref } = req.params
      let path = req.query.path

      manifest.getManifest(user, repo, { path, ref, authToken }, (err, manifest) => {
        if (err) return next(Boom.wrap(err, 500, 'Failed to get package.json'))

        const depsType = getDepsType(opts)
        let deps

        if (depsType) {
          deps = manifest[`${depsType}Dependencies`] || {}
        } else {
          deps = manifest.dependencies || {}
        }

        let graphName = user + '/' + repo

        if (path && path[path.length - 1] === '/') {
          path = path.slice(0, -1)
        }

        if (path) {
          graphName += '/' + req.query.path
        }

        if (ref) {
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
            if (err) return next(Boom.wrap(err, 500, 'Failed to get graph data'))
            res.json(graph)
          })
      })
    })
  }
}
