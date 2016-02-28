var manifest = require('../../lib/manifest')
var graph = require('../../lib/graph')
var errors = require('../helpers/errors')
var getDepsType = require('../helpers/get-deps-type')

function sendDependencyGraph (req, res, opts) {
  req.session.get('session/access-token', function (err, authToken) {
    if (errors.happened(err, req, res, 'Failed to get session access token')) {
      return
    }

    manifest.getManifest(req.params.user, req.params.repo, req.query.path, req.params.ref, authToken, function (err, manifest) {
      if (errors.happened(err, req, res, 'Failed to get package.json')) {
        return
      }

      var depsType = getDepsType(opts)
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
        function (err, graph) {
          if (errors.happened(err, req, res, 'Failed to get graph data')) {
            return
          }

          res.json(graph)
        })
    })
  })
}

function dependencyGraph (req, res) {
  sendDependencyGraph(req, res, {})
}

dependencyGraph.dev = function (req, res) {
  sendDependencyGraph(req, res, {dev: true})
}

dependencyGraph.peer = function (req, res) {
  sendDependencyGraph(req, res, {peer: true})
}

dependencyGraph.optional = function (req, res) {
  sendDependencyGraph(req, res, {optional: true})
}

module.exports = dependencyGraph
