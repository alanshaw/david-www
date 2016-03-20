var path = require('path')
var express = require('express')
var compress = require('compression')
var consolidate = require('consolidate')
var david = require('david')
var npm = require('npm')

var config = require('./config')
var nspApiClient = require('nsp-advisories-api')()
var db = require('./lib/db')(config.db)
var nsp = require('./lib/nsp')(nspApiClient, db)
var registry = require('./lib/registry')(config.npm)
var github = require('./lib/github')(config.github)
var manifest = require('./lib/manifest')(db, registry, github, config.github)
var brains = require('./lib/brains')(david, db, registry, nsp, config.brains, config.npm)
var graph = require('./lib/graph')(db, config.npm)
var changelog = require('./lib/changelog')(config.github, config.npm)
var profile = require('./lib/profile')(manifest, brains, github)
var feed = require('./lib/feed')(npm, config.npm, config.site)
var stats = require('./lib/stats')(registry, manifest)

var app = express()

app.engine('html', consolidate.handlebars)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'dist'))
app.use(compress())

var statics = require('./statics')

statics(app)

var middleware = require('./middleware')

middleware.session(app, db)
middleware.user(app)
middleware.generateCsrf(app)
middleware.globals(app, config)
middleware.cors(app)

var routes = require('./routes')

routes.session.oauthCallback(app)
routes.rss.news(app)
routes.api.dependencyCounts(app, stats)
routes.stats(app, stats)
routes.api.changelog(app, changelog)
routes.api.info(app, manifest, brains)
routes.api.graph(app, graph, manifest)
routes.rss.feed(app, feed, manifest)
routes.badge(app, manifest, brains)
routes.status(app, manifest, brains)
routes.profile(app, profile)
routes.homepage(app, stats)

middleware['404'](app)

nsp.syncAdvisories()
nsp.syncAdvisoriesPeriodically(config.nsp && config.nsp.syncAdvisoriesInterval)

var port = process.env.PORT || 1337

var server = app.listen(port, function () {
  console.log('David started', server.address())
})
