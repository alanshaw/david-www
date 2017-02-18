import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import {
  SET_VERSION,
  SET_CONFIG,
  SET_USER,
  REQUEST_CSRF_TOKEN,
  RECEIVE_CSRF_TOKEN,
  REQUEST_USER,
  RECEIVE_USER,
  REQUEST_PROJECT,
  RECEIVE_PROJECT,
  REQUEST_INFO,
  RECEIVE_INFO,
  REQUEST_DEPENDENCY_GRAPH,
  RECEIVE_DEPENDENCY_GRAPH,
  REQUEST_STATS,
  RECEIVE_STATS,
  REQUEST_DEPENDENCY_COUNTS,
  RECEIVE_DEPENDENCY_COUNTS,
  REQUEST_LATEST_NEWS,
  RECEIVE_LATEST_NEWS,
  REQUEST_CHANGES,
  RECEIVE_CHANGES
} from './actions'

function version (state = null, action) {
  switch (action.type) {
    case SET_VERSION:
      return action.version
    default:
      return state
  }
}

function config (state = null, action) {
  switch (action.type) {
    case SET_CONFIG:
      return action.config
    default:
      return state
  }
}

function user (state = null, action) {
  switch (action.type) {
    case REQUEST_USER:
      return null
    case SET_USER:
    case RECEIVE_USER:
      return action.user
    default:
      return state
  }
}

function csrfToken (state = null, action) {
  switch (action.type) {
    case REQUEST_CSRF_TOKEN:
      return null
    case RECEIVE_CSRF_TOKEN:
      return action.csrfToken
    default:
      return state
  }
}

function projectParams (state = null, action) {
  switch (action.type) {
    case REQUEST_PROJECT:
      return action.params
    default:
      return state
  }
}

function project (state = null, action) {
  switch (action.type) {
    case REQUEST_PROJECT:
      return null
    case RECEIVE_PROJECT:
      return action.project
    default:
      return state
  }
}

function infoParams (state = null, action) {
  switch (action.type) {
    case REQUEST_INFO:
      return action.params
    default:
      return state
  }
}

function info (state = null, action) {
  switch (action.type) {
    case REQUEST_INFO:
      return null
    case RECEIVE_INFO:
      return action.info
    default:
      return state
  }
}

function dependencyGraph (state = null, action) {
  switch (action.type) {
    case REQUEST_DEPENDENCY_GRAPH:
      return null
    case RECEIVE_DEPENDENCY_GRAPH:
      return action.graph
    default:
      return state
  }
}

function stats (state = null, action) {
  switch (action.type) {
    case RECEIVE_STATS:
      return action.stats
    default:
      return state
  }
}

function dependencyCounts (state = null, action) {
  switch (action.type) {
    case REQUEST_DEPENDENCY_COUNTS:
      return null
    case RECEIVE_DEPENDENCY_COUNTS:
      return action.counts
    default:
      return state
  }
}

function latestNews (state = null, action) {
  switch (action.type) {
    case RECEIVE_LATEST_NEWS:
      return action.news
    default:
      return state
  }
}

function changes (state = null, action) {
  switch (action.type) {
    case REQUEST_CHANGES:
      return null
    case RECEIVE_CHANGES:
      return action.changes
    default:
      return state
  }
}

export default combineReducers({
  version,
  config,
  user,
  csrfToken,
  projectParams,
  project,
  infoParams,
  info,
  dependencyGraph,
  stats,
  dependencyCounts,
  latestNews,
  changes,
  routing: routerReducer
})
