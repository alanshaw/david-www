import fetch from 'isomorphic-fetch'

export const SET_CONFIG = 'SET_CONFIG'
export function setConfig (user) {
  return { type: SET_CONFIG, user }
}

export const SET_USER = 'SET_USER'
export function setUser (user) {
  return { type: SET_USER, user }
}

export const SET_PROJECT = 'SET_PROJECT'
export function setProject (project) {
  return { type: SET_PROJECT, project }
}

export const REQUEST_STATS = 'REQUEST_STATS'
export function requestStats () {
  return { type: REQUEST_STATS }
}

export const RECEIVE_STATS = 'RECEIVE_STATS'
export function receiveStats (stats) {
  return { type: RECEIVE_STATS, stats }
}

export function fetchStats () {
  return (dispatch, getState) => {
    dispatch(requestStats())

    return fetch(`${getState().config.apiUrl}/stats.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveStats(json)))
  }
}

export const REQUEST_DEPENDENCY_COUNTS = 'REQUEST_DEPENDENCY_COUNTS'
export function requestDependencyCounts () {
  return { type: REQUEST_DEPENDENCY_COUNTS }
}

export const RECEIVE_DEPENDENCY_COUNTS = 'RECEIVE_DEPENDENCY_COUNTS'
export function receiveDependencyCounts (counts) {
  return { type: RECEIVE_DEPENDENCY_COUNTS, counts }
}

export function fetchDependencyCounts () {
  return (dispatch, getState) => {
    dispatch(requestDependencyCounts())

    return fetch(`${getState().config.apiUrl}/dependency-counts.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveDependencyCounts(json)))
  }
}
