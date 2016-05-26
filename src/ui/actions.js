import fetch from 'isomorphic-fetch'
import Qs from 'querystring'

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
export function requestProject (data) {
  return { type: REQUEST_PROJECT, data }
}

export const RECEIVE_PROJECT = 'RECEIVE_PROJECT'
export function receiveProject (project) {
  return { type: RECEIVE_PROJECT, project }
}

export function fetchProject ({ user, repo, path, ref, type }) {
  return (dispatch, getState) => {
    const project = getState().project
    const projectData = { user, repo, path, ref, type }

    if (!projectChanged(project, projectData)) {
      return Promise.resolve(project)
    }

    dispatch(requestProject(projectData))

    const e = encodeURIComponent
    let url = `${getState().config.apiUrl}/${e(user)}/${e(repo)}`
    url += ref ? `/${e(ref)}` : ''
    url += type ? `/${e(type)}-info.json` : '/info.json'
    url += path ? `?path=${e(path)}` : ''

    // TODO: Cache?

    return fetch(url)
      .then(response => response.json())
      .then(json => dispatch(receiveProject(json)))
  }
}

function projectChanged (p1, p2) {
  return getProjectUrl(p1) !== getProjectUrl(p2)
}

function getProjectUrl (project) {
  if (!project) return null

  let url = `/${project.user}/${project.repo}`
  url += project.ref ? `/${project.ref}` : ''

  let qs = {}

  if (project.path) {
    qs.path = project.path
  }

  if (project.type) {
    qs.type = project.type
  }

  qs = Qs.stringify(qs)
  return url + (qs ? `?${qs}` : '')
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

export const REQUEST_LATEST_NEWS = 'REQUEST_LATEST_NEWS'
export function requestLatestNews () {
  return { type: REQUEST_LATEST_NEWS }
}

export const RECEIVE_LATEST_NEWS = 'RECEIVE_LATEST_NEWS'
export function receiveLatestNews (news) {
  return { type: RECEIVE_LATEST_NEWS, news }
}

export function fetchLatestNews () {
  return (dispatch, getState) => {
    dispatch(requestLatestNews())

    return fetch(`${getState().config.apiUrl}/news/latest.json`)
      .then(response => response.json())
      .then(json => dispatch(receiveLatestNews(json)))
  }
}
