var express = require("express")
var compress = require("compression")
var consolidate = require("consolidate")
var config = require("config")
var levelSession = require("level-session")
var stats = require("./stats")
var manifest = require("./manifest")
var statics = require("./statics")
var auth = require("./auth")
var brains = require("./brains")
var errors = require("./errors")
var graph = require("./graph")
var feed = require("./feed")
var profile = require("./profile")
var newsFeed = require("./news-feed")
var search = require("./search")
var changelog = require("./changelog")
var nsp = require("./nsp")

nsp.updateAdvisories(function (er) {
  if (er) return console.error("Failed to update advisories", er)
  console.log("Updated NSP advisories")
  nsp.updateAdvisoriesPeriodically(config.nsp && config.nsp.advisoriesUpdateInterval)
})

var app = express()

app.engine("html", consolidate.handlebars)
app.set("view engine", "html")
app.set("views", __dirname + "/dist")
app.use(compress())

statics.init(app)

app.use(levelSession(config.db.path))
app.use(function (req, res, next) {
  // TODO: restrict this middleware to routes that actually need it?
  req.session.get("session/csrf-token", function (err, csrfToken) {
    if (csrfToken) {
      return next()
    }
    req.session.set("session/csrf-token", auth.generateNonce(64), next)
  })
})

app.get("/auth/callback",                      oauthCallback)
app.get("/news/rss.xml",                       newsRssFeed)
app.get("/dependency-counts.json",             dependencyCounts)
app.get("/stats",                              statsPage)
app.get("/search",                             searchPage)
app.get("/search.json",                        searchQuery)
app.get("/package/:pkg/changes.json",          changes)
app.get("/:user/:repo/:ref?/dev-info.json",          devInfo)
app.get("/:user/:repo/:ref?/info.json",              info)
app.get("/:user/:repo/:ref?/peer-info.json",         peerInfo)
app.get("/:user/:repo/:ref?/optional-info.json",     optionalInfo)
app.get("/:user/:repo/:ref?/graph.json",             dependencyGraph)
app.get("/:user/:repo/:ref?/dev-graph.json",         devDependencyGraph)
app.get("/:user/:repo/:ref?/peer-graph.json",        peerDependencyGraph)
app.get("/:user/:repo/:ref?/optional-graph.json",    optionalDependencyGraph)
app.get("/:user/:repo/:ref?/rss.xml",                rssFeed)
app.get("/:user/:repo/:ref?/dev-rss.xml",            devRssFeed)
app.get("/:user/:repo/:ref?/status.png",             statusBadge)
app.get("/:user/:repo/:ref?/status@2x.png",          retinaStatusBadge)
app.get("/:user/:repo/:ref?/status.svg",             svgStatusBadge)
app.get("/:user/:repo/:ref?/dev-status.png",         devStatusBadge)
app.get("/:user/:repo/:ref?/dev-status@2x.png",      retinaDevStatusBadge)
app.get("/:user/:repo/:ref?/dev-status.svg",         svgDevStatusBadge)
app.get("/:user/:repo/:ref?/peer-status.png",        peerStatusBadge)
app.get("/:user/:repo/:ref?/peer-status@2x.png",     retinaPeerStatusBadge)
app.get("/:user/:repo/:ref?/peer-status.svg",        svgPeerStatusBadge)
app.get("/:user/:repo/:ref?/optional-status.png",    optionalStatusBadge)
app.get("/:user/:repo/:ref?/optional-status@2x.png", retinaOptionalStatusBadge)
app.get("/:user/:repo/:ref?/optional-status.svg",    svgOptionalStatusBadge)
app.get("/:user/:repo/:ref?@2x.png",                 retinaStatusBadge)
app.get("/:user/:repo/:ref?.svg",                    svgStatusBadge)
app.get("/:user/:repo/:ref?.png",                    statusBadge)
app.get("/:user/:repo/:ref?",                        statusPage)
app.get("/:user",                              profilePage)
app.get("/",                                   indexPage)

/**
 * Helper for adding common data to template renders.
 * Used to simplify setup of "Sign in with GitHub" CTA in header.
 */
function _renderWithCommonData (res, template, data) {
  data = data || {}
  res.session.getAll(function (err, sessionData) {
    if (!sessionData["session/access-token"]) {
      data.csrfToken = sessionData["session/csrf-token"]
      data.oauthClient = config.github.oauth.id
    }
    res.render(template, data)
  })
}

/**
 * Do a home page
 */
function indexPage (req, res) {
  _renderWithCommonData(res, "index", {
    recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
    recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages()
  })
}

/**
 * Handle OAuth callback
 */
function oauthCallback (req, res) {
  req.session.get("session/csrf-token", function (err, csrfToken) {
    if (err || csrfToken !== req.query.state || !req.query.code) {
      res.status(401)
      return _renderWithCommonData(res, 401)
    }

    auth.requestAccessToken(req.query.code, function (err, data) {
      if (err) {
        res.status(401)
        return _renderWithCommonData(res, 401)
      }

      req.session.set("session/access-token", data.access_token, function () {
        req.session.set("session/user", data.user, function () {
          res.redirect("/?success")
        })
      })
    })
  })

}

/**
 * Show pretty graphs and gaudy baubles
 */
function statsPage (req, res) {
  _renderWithCommonData(res, "stats", {
    recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages(),
    recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
    recentlyUpdatedManifests: stats.getRecentlyUpdatedManifests()
  })
}

function dependencyCounts (req, res) {
  res.json(stats.getDependencyCounts())
}

function newsRssFeed (req, res) {
  newsFeed.get(function (er, xml) {
    if (errors.happened(er, req, res, "Failed to get news feed xml")) {
      return
    }

    res.contentType("application/rss+xml")
    res.status(200).send(xml)
  })
}

/**
 * Send the status badge for this user and repository
 */
function statusPage (req, res) {
  withManifestAndInfo(req, res, function (manifest, info) {
    _renderWithCommonData(res, "status", {
      user: req.params.user,
      repo: req.params.repo,
      ref:  req.params.ref ? "/" + req.params.ref : "",
      manifest: manifest,
      info: info
    })
  })
}

function profilePage (req, res) {
  var authToken = null
  req.session.getAll(function (err, sessionData) {
    if (req.params.user === sessionData["session/user"]) {
      authToken = sessionData["session/access-token"]
    }

    profile.get(req.params.user, authToken, function (er, data) {
      if (errors.happened(er, req, res, "Failed to get profile data")) {
        return
      }

      var avatarUrl

      for (var i = 0; i < data.length; i++) {
        if (data[i].repo.owner.login == req.params.user) {
          avatarUrl = data[i].repo.owner.avatar_url
          break
        }
      }

      _renderWithCommonData(res, "profile", {user: req.params.user, avatarUrl: avatarUrl, repos: data})
    })
  })
}

function searchPage (req, res) {
  _renderWithCommonData(res, "search", {q: req.query.q})
}

function searchQuery (req, res) {
  search(req.query.q, function (er, results) {
    if (errors.happened(er, req, res, "Failed to get search results")) {
      return
    }

    res.json(results)
  })
}

function changes (req, res) {
  changelog.getChanges(req.params.pkg, req.query.from, req.query.to, function (er, changes) {
    if (er) {
      console.warn(er)
      return res.status(500).send({er: "Failed to get changes"})
    }
    res.send(changes)
  })
}

function getDepsType (opts) {
  var type = ""

  if (opts.dev) {
    type = "dev"
  } else if (opts.peer) {
    type = "peer"
  } else if (opts.optional) {
    type = "optional"
  }

  return type
}

function getBadgePath (status, opts) {
  opts = opts || {}

  var type = opts.type ? opts.type + "-" : ""
  var retina = opts.retina ? "@2x" : ""
  var extension = opts.extension == "png" ? "png" : "svg"
  var style = extension == "svg" && (style == "flat-square") ? "-" + style : ""

  return __dirname + "/dist/img/status/" + type + status + retina + style + "." + extension
}

/**
 * Send the status badge for this user and repository
 */
function sendStatusBadge (req, res, opts) {
  opts = opts || {}

  res.setHeader("Cache-Control", "no-cache")

  var badgePathOpts = {
    type: getDepsType(opts),
    retina: opts.retina,
    style: req.query.style,
    extension: opts.extension
  }

  var sendFileCb = function (er) {
    if (er) {
      console.error("Failed to send status badge", er)
      if (er.code == "ENOENT") return res.status(404).end()
      res.status(500).end()
    }
  }

  req.session.get("session/access-token", function (er, authToken) {
    if (er) return res.status(500).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (er) return res.status(404).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

      brains.getInfo(manifest, opts, function (er, info) {
        if (er) return res.status(500).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

        res.sendFile(getBadgePath(info.status, badgePathOpts), sendFileCb)
      })
    })
  })
}

function statusBadge (req, res) {
  sendStatusBadge(req, res, {extension: "png"})
}

function svgStatusBadge (req, res) {
  sendStatusBadge(req, res, {extension: "svg"})
}

function retinaStatusBadge (req, res) {
  sendStatusBadge(req, res, {retina: true, extension: "png"})
}

function devStatusBadge (req, res) {
  sendStatusBadge(req, res, {dev: true, extension: "png"})
}

function svgDevStatusBadge (req, res) {
  sendStatusBadge(req, res, {dev: true, extension: "svg"})
}

function retinaDevStatusBadge (req, res) {
  sendStatusBadge(req, res, {dev: true, retina: true, extension: "png"})
}

function peerStatusBadge (req, res) {
  sendStatusBadge(req, res, {peer: true, extension: "png"})
}

function svgPeerStatusBadge (req, res) {
  sendStatusBadge(req, res, {peer: true, extension: "svg"})
}

function retinaPeerStatusBadge (req, res) {
  sendStatusBadge(req, res, {peer: true, retina: true, extension: "png"})
}

function optionalStatusBadge (req, res) {
  sendStatusBadge(req, res, {optional: true, extension: "png"})
}

function svgOptionalStatusBadge (req, res) {
  sendStatusBadge(req, res, {optional: true, extension: "svg"})
}

function retinaOptionalStatusBadge (req, res) {
  sendStatusBadge(req, res, {optional: true, retina: true, extension: "png"})
}

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

function devDependencyGraph (req, res) {
  sendDependencyGraph(req, res, {dev: true})
}

function peerDependencyGraph (req, res) {
  sendDependencyGraph(req, res, {peer: true})
}

function optionalDependencyGraph (req, res) {
  sendDependencyGraph(req, res, {optional: true})
}

function buildRssFeed (req, res, dev) {
  req.session.get("session/access-token", function (err, authToken) {
    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (errors.happened(er, req, res, "Failed to get package.json")) {
        return
      }

      feed.get(manifest, {dev: dev}, function (er, xml) {
        if (errors.happened(er, req, res, "Failed to build RSS XML")) {
          return
        }

        res.contentType("application/rss+xml")
        res.send(xml, 200)
      })
    })
  })
}

function rssFeed (req, res) {
  buildRssFeed(req, res, false)
}

function devRssFeed (req, res) {
  buildRssFeed(req, res, true)
}

function info (req, res) {
  withManifestAndInfo(req, res, function (manifest, info) {
    res.json(info)
  })
}

function devInfo (req, res) {
  withManifestAndInfo(req, res, {dev: true}, function (manifest, info) {
    res.json(info)
  })
}

function peerInfo (req, res) {
  withManifestAndInfo(req, res, {peer: true}, function (manifest, info) {
    res.json(info)
  })
}

function optionalInfo (req, res) {
  withManifestAndInfo(req, res, {optional: true}, function (manifest, info) {
    res.json(info)
  })
}

/**
 * Common callback boilerplate of getting a manifest and info for the status page and badge
 */
function withManifestAndInfo (req, res, opts, cb) {
  // Allow callback to be passed as third parameter
  if (!cb) {
    cb = opts
    opts = {}
  } else {
    opts = opts || {}
  }

  req.session.get("session/access-token", function (err, authToken) {
    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (errors.happened(er, req, res, "Failed to get package.json")) {
        return
      }

      brains.getInfo(manifest, opts, function (er, info) {
        if (errors.happened(er, req, res, "Failed to get dependency info")) {
          return
        }

        cb(manifest, info)
      })
    })
  })
}

app.use(function (req, res) {
  res.status(404)

  // respond with html page
  if (req.accepts("html")) {
    return res.render("404")
  }

  // respond with json
  if (req.accepts("json")) {
    return res.send({er: "Not found"})
  }

  // default to plain-text. send()
  res.type("txt").send("Not found")
})

var port = process.env.PORT || 1337

app.listen(port)

process.title = "david:" + port

console.log("David listening on port", port)
