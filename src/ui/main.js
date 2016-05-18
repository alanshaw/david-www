import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import reducers from './reducers'
import Routes from './routes'
import Head from './components/head'

const initialState = window.__REDUX_STATE__
const store = createStore(reducers, initialState)

syncHistoryWithStore(browserHistory, store)

render((
  <div>
    <Head />
    <Provider store={store}>
      <Routes store={store} />
    </Provider>
  </div>
), document.getElementById('root'))
