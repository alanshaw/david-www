import React from 'react'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { Home, Status, Error404 } from './pages'
import Layout from './components/layout.jsx'

export default function (props = {}) {
  let history = browserHistory

  if (props.store) {
    history = syncHistoryWithStore(browserHistory, props.store)
  }

  return (
    <Router history={history}>
      <Route path='/' component={Layout}>
        <IndexRoute component={Home} />
        <Route path='status' component={Status} />
        <Route path='*' component={Error404} />
      </Route>
    </Router>
  )
}
