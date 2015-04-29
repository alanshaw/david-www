var manifest = require("../../lib/manifest")
var graph = require("../../lib/graph")
var errors = require("../helpers/errors")
var getDepsType = require("../helpers/get-deps-type")

function sendDependencyGraph (req, res, opts) {
  req.session.get("session/access-token", function (err, authToken) {
    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (errors.happened(er, req, res, "Failed to get package.json")) {
        return
      }

      var depsType = getDepsType(opts)
        , deps

      if (depsType) {
        deps = manifest[depsType + "Dependencies"] || {}
      } else {
        deps = manifest.dependencies || {}
      }

      graph.getProjectDependencyGraph(
        req.params.user + "/" + req.params.repo + (depsType ? "#" + depsType : ""),
        manifest.version,
        deps,
        function (er, graph) {
          if (errors.happened(er, req, res, "Failed to get graph data")) {
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
