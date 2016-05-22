import express from 'express'
import compress from 'compression'
import david from 'david'
import npm from 'npm'
import Helmet from 'react-helmet'
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
import createAuth from './lib/auth'
import createManifest from './lib/manifest'
import createBrains from './lib/brains'
import createGraph from './lib/graph'
import createChangelog from './lib/changelog'
import createProfile from './lib/profile'
import createFeed from './lib/feed'
import createStats from './lib/stats'

const nspApiClient = createNspApiClient()
const db = createDb({ dbConfig: config.db })
const nsp = createNsp({ nspApiClient, db })
const registry = createRegistry({ npmConfig: config.npm })
const github = createGithub({ githubConfig: config.github })
const auth = createAuth({ github, githubConfig: config.github })
const manifest = createManifest({ db, registry, github, githubConfig: config.github })
const brains = createBrains({ david, db, registry, nsp, brainsConfig: config.brains, npmConfig: config.npm })
const graph = createGraph({ db, npmConfig: config.npm })
const changelog = createChangelog({ githubConfig: config.github, npmConfig: config.npm })
const profile = createProfile({ manifest, brains, github })
const feed = createFeed({ npm, npmConfig: config.npm, siteConfig: config.site })
const stats = createStats({ registry, manifest })

const app = express()

app.use(compress())

import statics from './statics'

statics({ app, version: pkg.version })

import middleware from './middleware'

middleware.session({ app, db })
middleware.user({ app })
middleware.generateCsrf({ app, auth })
middleware.globals({ app, config })
middleware.cors({ app })

import routes from './routes'

routes.session.oauthCallback(app, auth)
routes.rss.news(app)
routes.api.dependencyCounts(app, stats)
routes.api.stats(app, stats)
routes.api.changelog(app, changelog)
routes.api.info(app, manifest, brains)
routes.api.graph(app, graph, manifest)
routes.api.news(app)
routes.rss.feed(app, feed, manifest)
routes.badge(app, manifest, brains)

import uiRoutes from './ui/routes.jsx'

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
      return next(Boom.notFound())
    }

    const Comp = components[components.length - 1].WrappedComponent
    const fetchData = (Comp && Comp.fetchData) || (() => Promise.resolve())

    const initialState = { config: config.public }
    const store = createStore(reducers, initialState, applyMiddleware(thunkMiddleware))
    const { location, params, history } = renderProps

    fetchData({ store, location, params, history })
      .then(() => {
        const state = store.getState()
        const body = bodyTpl({ store, props: renderProps })

        const head = Helmet.rewind()

        res.send(layoutTpl({ body, state, head, version: pkg.version }))
      })
      .catch((err) => next(err))
  })
})

routes.status(app, manifest, brains)
routes.profile(app, profile)
routes.homepage(app, stats)

// TODO: error middleware

nsp.syncAdvisories()
nsp.syncAdvisoriesPeriodically(config.nsp && config.nsp.syncAdvisoriesInterval)

const port = parseInt(process.env.PORT || 1337, 10)
const server = app.listen(port, () => console.log('David started', server.address()))
