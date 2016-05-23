import React from 'react'
import { Router, Route, IndexRoute, browserHistory, applyRouterMiddleware } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import useScroll from 'react-router-scroll'
import { Home, Stats, Status, Error404 } from './pages'
import Layout from './components/layout.jsx'

export default function (props = {}) {
  let history = browserHistory

  if (props.store) {
    history = syncHistoryWithStore(browserHistory, props.store)
  }

  return (
    <Router history={history} render={applyRouterMiddleware(useScroll())}>
      <Route path='/' component={Layout}>
        <IndexRoute component={Home} />
        <Route path='stats' component={Stats} />
        <Route path='status' component={Status} />
        <Route path='*' component={Error404} />
      </Route>
    </Router>
  )
}
