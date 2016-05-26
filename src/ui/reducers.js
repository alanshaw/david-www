import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import {
  SET_VERSION,
  SET_CONFIG,
  SET_USER,
  RECEIVE_PROJECT,
  RECEIVE_STATS,
  RECEIVE_DEPENDENCY_COUNTS,
  RECEIVE_LATEST_NEWS
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
    case SET_USER:
      return action.user
    default:
      return state
  }
}

function project (state = null, action) {
  switch (action.type) {
    case RECEIVE_PROJECT:
      return action.project
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

export default combineReducers({
  version,
  config,
  user,
  project,
  stats,
  dependencyCounts,
  latestNews,
  routing: routerReducer
})
