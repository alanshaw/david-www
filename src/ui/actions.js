import fetch from 'isomorphic-fetch'

const e = encodeURIComponent

export const SET_VERSION = 'SET_VERSION'
export function setVersion (version) {
  return { type: SET_VERSION, version }
}

export const SET_CONFIG = 'SET_CONFIG'
export function setConfig (user) {
  return { type: SET_CONFIG, user }
}

export const SET_USER = 'SET_USER'
export function setUser (user) {
  return { type: SET_USER, user }
}

export const REQUEST_PROJECT = 'REQUEST_PROJECT'
export function requestProject (params) {
  return (dispatch, getState) => {
    if (isEqual(getState().projectParams, params)) {
      return Promise.resolve(getState().project)
    }

    dispatch({ type: REQUEST_PROJECT, params })

    const { user, repo, path, ref } = params

    let url = `${getState().config.apiUrl}/${e(user)}/${e(repo)}`
    url += ref ? `/${e(ref)}` : ''
    url += '/project.json'
    url += path ? `?path=${e(path)}` : ''

    // TODO: Cache?

    return fetch(url)
      .then(response => response.json())
      .then(json => dispatch(receiveProject(json)))
  }
}

export const RECEIVE_PROJECT = 'RECEIVE_PROJECT'
export function receiveProject (project) {
  return { type: RECEIVE_PROJECT, project }
}

export const REQUEST_INFO = 'REQUEST_INFO'
export function requestInfo (params) {
  return (dispatch, getState) => {
    if (isEqual(getState().infoParams, params)) {
      return Promise.resolve(getState().info)
    }

    dispatch({ type: REQUEST_INFO, params })

    const { user, repo, path, ref, type } = params

    let url = `${getState().config.apiUrl}/${e(user)}/${e(repo)}`
    url += ref ? `/${e(ref)}` : ''
    url += type ? `/${e(type)}-info.json` : '/info.json'
    url += path ? `?path=${e(path)}` : ''

    // TODO: Cache?

    return fetch(url)
      .then(response => response.json())
      .then(json => dispatch(receiveInfo(json)))
  }
}

export const RECEIVE_INFO = 'RECEIVE_INFO'
export function receiveInfo (info) {
  return { type: RECEIVE_INFO, info }
}

export const REQUEST_DEPENDENCY_GRAPH = 'REQUEST_DEPENDENCY_GRAPH'
export function requestDependencyGraph (params) {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_DEPENDENCY_GRAPH, params })

    const { user, repo, path, ref, type } = params

    let url = `${getState().config.apiUrl}/${e(user)}/${e(repo)}`
    url += ref ? `/${e(ref)}` : ''
    url += type ? `/${e(type)}-graph.json` : '/graph.json'
    url += path ? `?path=${e(path)}` : ''

    // TODO: Cache?

    return fetch(url)
      .then(response => response.json())
      .then(json => dispatch(receiveDependencyGraph(json)))
  }
}

export const RECEIVE_DEPENDENCY_GRAPH = 'RECEIVE_DEPENDENCY_GRAPH'
export function receiveDependencyGraph (graph) {
  return { type: RECEIVE_DEPENDENCY_GRAPH, graph }
}

export const REQUEST_STATS = 'REQUEST_STATS'
export function requestStats () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_STATS })

    return fetch(`${getState().config.apiUrl}/stats.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveStats(json)))
  }
}

export const RECEIVE_STATS = 'RECEIVE_STATS'
export function receiveStats (stats) {
  return { type: RECEIVE_STATS, stats }
}

export const REQUEST_DEPENDENCY_COUNTS = 'REQUEST_DEPENDENCY_COUNTS'
export function requestDependencyCounts () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_DEPENDENCY_COUNTS })

    return fetch(`${getState().config.apiUrl}/dependency-counts.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveDependencyCounts(json)))
  }
}

export const RECEIVE_DEPENDENCY_COUNTS = 'RECEIVE_DEPENDENCY_COUNTS'
export function receiveDependencyCounts (counts) {
  return { type: RECEIVE_DEPENDENCY_COUNTS, counts }
}

export const REQUEST_LATEST_NEWS = 'REQUEST_LATEST_NEWS'
export function requestLatestNews () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_LATEST_NEWS })

    return fetch(`${getState().config.apiUrl}/news/latest.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveLatestNews(json)))
  }
}

export const RECEIVE_LATEST_NEWS = 'RECEIVE_LATEST_NEWS'
export function receiveLatestNews (news) {
  return { type: RECEIVE_LATEST_NEWS, news }
}

function isEqual (obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
