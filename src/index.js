import express from 'express'
import compress from 'compression'
import david from 'david'
import npm from 'npm'
import Helmet from 'react-helmet'
import { match } from 'react-router'
import { createStore } from 'redux'
import Boom from 'boom'
import reducers from './ui/reducers'
import { layoutTpl, bodyTpl } from './ui/server'

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

statics({app})

import middleware from './middleware'

middleware.session({ app, db })
middleware.user({ app })
middleware.generateCsrf({ app, auth })
middleware.globals({ app, config })
middleware.cors({ app })

import uiRoutes from './ui/routes'

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
    const fetchData = (Comp && Comp.fetchData) || ((_, cb) => cb())

    const store = createStore(reducers)
    const {location, params, history} = renderProps

    fetchData({ location, params, history, store }, (err) => {
      if (err) return next(err)

      const state = store.getState()
      const html = bodyTpl({ store, props: renderProps })

      const head = Helmet.rewind()

      res.send(layoutTpl({ html, state, head }))
    })
  })
})

import routes from './routes'

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

nsp.syncAdvisories()
nsp.syncAdvisoriesPeriodically(config.nsp && config.nsp.syncAdvisoriesInterval)

const port = parseInt(process.env.PORT || 1337, 10)
const server = app.listen(port, () => console.log('David started', server.address()))
