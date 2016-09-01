import React from 'react'
import { Router, Route, IndexRoute, browserHistory, applyRouterMiddleware } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { useScroll } from 'react-router-scroll'
import { Error404, Home, Project, Stats } from './pages'
import Layout from './components/layout.jsx'

export default function (props = {}) {
  let history = browserHistory

  if (props.store) {
    history = syncHistoryWithStore(browserHistory, props.store)
  }

  // If the route component has a static shouldUpdateScroll function then
  // use this to determine if scroll middleware should be applied
  const useScrollMiddleware = useScroll((prevRouterProps, routerProps) => {
    const component = routerProps.routes[routerProps.routes.length - 1].component

    if (component && component.shouldUpdateScroll) {
      return component.shouldUpdateScroll(prevRouterProps, routerProps)
    }

    return true
  })

  return (
    <Router history={history} render={applyRouterMiddleware(useScrollMiddleware)}>
      <Route path='/' component={Layout}>
        <IndexRoute component={Home} />
        <Route path='stats' component={Stats} />
        <Route path=':user/:repo(/:ref)' component={Project} />
        <Route path='*' component={Error404} />
      </Route>
    </Router>
  )
}
