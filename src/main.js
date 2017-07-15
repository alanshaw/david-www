import express from 'express'
import compress from 'compression'
import david from 'david'
import npm from 'npm'
import { Helmet } from 'react-helmet'
import { match } from 'react-router'
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import Boom from 'boom'
import pkg from '../package.json'
import reducers from './ui/reducers'
import { layoutTpl, bodyTpl } from './ui/server.jsx'

import config from './config'
import createNspApiClient from 'nsp-advisories-api'
import createDb from './lib/db'
import createNsp from './lib/nsp'
import createRegistry from './lib/registry'
import createGithub from './lib/github'
import createGitlab from './lib/gitlab'
import createAuth from './lib/auth'
import createManifest from './lib/manifest'
import createBrains from './lib/brains'
import createGraph from './lib/graph'
import createChangelog from './lib/changelog'
import createProfile from './lib/profile'
import createFeed from './lib/feed'
import createStats from './lib/stats'
import createCache from './lib/cache'
import createQueue from './lib/queue'

import statics from './statics'
import middleware from './middleware'
import routes from './routes'
import uiRoutes from './ui/routes.jsx'

const nspApiClient = createNspApiClient()
const db = createDb({ dbConfig: config.db })
const nsp = createNsp({ nspApiClient, db })
const registry = createRegistry({ npmConfig: config.npm })
const github = createGithub({ githubConfig: config.github })
const gitlab = createGitlab({ gitlabConfig: config.gitlab })
const auth = createAuth({ github, githubConfig: config.github })
const manifest = createManifest({ db, registry, github, githubConfig: config.github, gitlab, gitlabConfig: config.gitlab })
const brains = createBrains({ david, db, registry, nsp, brainsConfig: config.brains, npmConfig: config.npm })
const graph = createGraph({ db, npmConfig: config.npm })
const changelog = createChangelog({ github, githubConfig: config.github, npmConfig: config.npm })
// TODO: Reinstate paginated
const profile = createProfile({ manifest, brains, github }) // eslint-disable-line
const feed = createFeed({ npm, npmConfig: config.npm, siteConfig: config.site })
const stats = createStats({ registry, manifest })
const cache = createCache({ db })
const queue = createQueue({ db, manifest, brains, cache })

const app = express()

app.use(compress())

statics({ app, version: pkg.version })

middleware.session({ app, db })
middleware.user({ app })
middleware.cors({ app })
middleware.errorHandler({ app })

routes.session.oauthCallback(app, auth)
routes.rss.news(app)
routes.api.csrfToken(app, auth)
routes.api.dependencyCounts(app, stats)
routes.api.stats(app, stats)
routes.api.changelog(app, changelog)
routes.api.info(app, manifest, brains)
routes.api.graph(app, graph, manifest)
routes.api.news(app)
routes.api.project(app, manifest)
routes.api.user(app)
routes.rss.feed(app, feed, manifest)
routes.badge(app, manifest, brains, cache, queue)

app.get('*', (req, res, next) => {
  match({ routes: uiRoutes(), location: req.url }, (err, redirectLocation, renderProps) => {
    if (err) return next(err)

    if (redirectLocation) {
      return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    }

    if (!renderProps) {
      return next(Boom.notFound())
    }

    const components = renderProps.components

    if (components.some((c) => c && c.displayName === 'error-404')) {
      res.status(404)
    }

    const initialState = { config: config.public, version: pkg.version }
    const store = createStore(reducers, initialState, applyMiddleware(thunkMiddleware))
    const { location, params, history } = renderProps

    Promise
      .all(
        components
          .filter((c) => c && c.requestData)
          .map((c) => c.requestData({ store, location, params, history }))
      )
      .then(() => {
        const body = bodyTpl({ store, props: renderProps })
        const state = store.getState()
        const head = Helmet.renderStatic()

        res.send(layoutTpl({ head, body, state, version: pkg.version }))
      })
      .catch((err) => next(err))
  })
})

nsp.syncAdvisories()
nsp.syncAdvisoriesPeriodically(config.nsp && config.nsp.syncAdvisoriesInterval)

const port = parseInt(process.env.PORT || 1337, 10)
const server = app.listen(port, () => console.log('David started', server.address()))
