const path = require('path')
const express = require('express')
const compress = require('compression')
const consolidate = require('consolidate')
const david = require('david')
const npm = require('npm')

const config = require('./config')
const nspApiClient = require('nsp-advisories-api')()
const db = require('./lib/db')(config.db)
const nsp = require('./lib/nsp')(nspApiClient, db)
const registry = require('./lib/registry')(config.npm)
const github = require('./lib/github')(config.github)
const auth = require('./lib/auth')(github, config.github)
const manifest = require('./lib/manifest')(db, registry, github, config.github)
const brains = require('./lib/brains')(david, db, registry, nsp, config.brains, config.npm)
const graph = require('./lib/graph')(db, config.npm)
const changelog = require('./lib/changelog')(config.github, config.npm)
const profile = require('./lib/profile')(manifest, brains, github)
const feed = require('./lib/feed')(npm, config.npm, config.site)
const stats = require('./lib/stats')(registry, manifest)

const app = express()

app.engine('html', consolidate.handlebars)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'dist'))
app.use(compress())

const statics = require('./statics')

statics(app)

const middleware = require('./middleware')

middleware.session(app, db)
middleware.user(app)
middleware.generateCsrf(app, auth)
middleware.globals(app, config)
middleware.cors(app)

const routes = require('./routes')

routes.session.oauthCallback(app, auth)
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

const port = process.env.PORT || 1337
const server = app.listen(port, () => console.log('David started', server.address()))
