import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import { SET_CONFIG, SET_USER, SET_PROJECT } from './actions'

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
    case SET_PROJECT:
      return action.project
    default:
      return state
  }
}

export default combineReducers({ config, user, project, routing: routerReducer })
