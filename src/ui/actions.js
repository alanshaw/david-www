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

export const REQUEST_CSRF_TOKEN = 'REQUEST_CSRF_TOKEN'
export function requestCsrfToken () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_CSRF_TOKEN })

    const url = `${getState().config.apiUrl}/csrf-token.json`

    return fetch(url, { credentials: 'same-origin' })
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveCsrfToken(json))
            return json
          } else {
            dispatch(requestCsrfTokenError(json))
            return Promise.reject(new Error(json.message || 'Failed to request CSRF token'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request CSRF token', err)
        dispatch(requestCsrfTokenError(new Error('Request CSRF token failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_CSRF_TOKEN = 'RECEIVE_CSRF_TOKEN'
export function receiveCsrfToken (csrfToken) {
  return { type: RECEIVE_CSRF_TOKEN, csrfToken }
}

export const REQUEST_CSRF_TOKEN_ERROR = 'REQUEST_CSRF_TOKEN_ERROR'
export function requestCsrfTokenError (err) {
  return { type: REQUEST_CSRF_TOKEN_ERROR, err }
}

export const REQUEST_USER = 'REQUEST_USER'
export function requestUser () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_USER })

    const url = `${getState().config.apiUrl}/user.json`

    return fetch(url, { credentials: 'same-origin' })
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveUser(json))
            return json
          } else {
            dispatch(requestUserError(json))
            return Promise.reject(new Error(json.message || 'Failed to request user'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request user', err)
        dispatch(requestUserError(new Error('Request user failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_USER = 'RECEIVE_USER'
export function receiveUser (user) {
  return { type: RECEIVE_USER, user }
}

export const REQUEST_USER_ERROR = 'REQUEST_USER_ERROR'
export function requestUserError (err) {
  return { type: REQUEST_USER_ERROR, err }
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
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveProject(json))
            return json
          } else {
            dispatch(requestProjectError(json))
            return Promise.reject(new Error(json.message || 'Failed to request project'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request project', err)
        dispatch(requestProjectError(new Error('Request project failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_PROJECT = 'RECEIVE_PROJECT'
export function receiveProject (project) {
  return { type: RECEIVE_PROJECT, project }
}

export const REQUEST_PROJECT_ERROR = 'REQUEST_PROJECT_ERROR'
export function requestProjectError (err) {
  return { type: REQUEST_PROJECT_ERROR, err }
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
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveInfo(json))
            return json
          } else {
            dispatch(requestInfoError(json))
            return Promise.reject(new Error(json.message || 'Failed to request info'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request info', err)
        dispatch(requestInfoError(new Error('Request info failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_INFO = 'RECEIVE_INFO'
export function receiveInfo (info) {
  return { type: RECEIVE_INFO, info }
}

export const REQUEST_INFO_ERROR = 'REQUEST_INFO_ERROR'
export function requestInfoError (err) {
  return { type: REQUEST_INFO_ERROR, err }
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
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveDependencyGraph(json))
            return json
          } else {
            dispatch(requestDependencyGraphError(json))
            return Promise.reject(new Error(json.message || 'Failed to request dependency graph'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request dependency graph', err)
        dispatch(requestDependencyGraphError(new Error('Request dependency graph failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_DEPENDENCY_GRAPH = 'RECEIVE_DEPENDENCY_GRAPH'
export function receiveDependencyGraph (graph) {
  return { type: RECEIVE_DEPENDENCY_GRAPH, graph }
}

export const REQUEST_DEPENDENCY_GRAPH_ERROR = 'REQUEST_DEPENDENCY_GRAPH_ERROR'
export function requestDependencyGraphError (err) {
  return { type: REQUEST_DEPENDENCY_GRAPH_ERROR, err }
}

export const REQUEST_STATS = 'REQUEST_STATS'
export function requestStats () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_STATS })

    return fetch(`${getState().config.apiUrl}/stats.json`)
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveStats(json))
            return json
          } else {
            dispatch(requestStatsError(json))
            return Promise.reject(new Error(json.message || 'Failed to request stats'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request stats', err)
        dispatch(requestStatsError(new Error('Request stats failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_STATS = 'RECEIVE_STATS'
export function receiveStats (stats) {
  return { type: RECEIVE_STATS, stats }
}

export const REQUEST_STATS_ERROR = 'REQUEST_STATS_ERROR'
export function requestStatsError (err) {
  return { type: REQUEST_STATS_ERROR, err }
}

export const REQUEST_DEPENDENCY_COUNTS = 'REQUEST_DEPENDENCY_COUNTS'
export function requestDependencyCounts () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_DEPENDENCY_COUNTS })

    return fetch(`${getState().config.apiUrl}/dependency-counts.json`)
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveDependencyCounts(json))
            return json
          } else {
            dispatch(requestDependencyCountsError(json))
            return Promise.reject(new Error(json.message || 'Failed to request dependency counts'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request dependency counts', err)
        dispatch(requestDependencyCountsError(new Error('Request dependency counts failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_DEPENDENCY_COUNTS = 'RECEIVE_DEPENDENCY_COUNTS'
export function receiveDependencyCounts (counts) {
  return { type: RECEIVE_DEPENDENCY_COUNTS, counts }
}

export const REQUEST_DEPENDENCY_COUNTS_ERROR = 'REQUEST_DEPENDENCY_COUNTS_ERROR'
export function requestDependencyCountsError (err) {
  return { type: REQUEST_DEPENDENCY_COUNTS_ERROR, err }
}

export const REQUEST_LATEST_NEWS = 'REQUEST_LATEST_NEWS'
export function requestLatestNews () {
  return (dispatch, getState) => {
    dispatch({ type: REQUEST_LATEST_NEWS })

    return fetch(`${getState().config.apiUrl}/news/latest.json`)
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveLatestNews(json))
            return json
          } else {
            dispatch(requestLatestNewsError(json))
            return Promise.reject(new Error(json.message || 'Failed to request latest news'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request latest news', err)
        dispatch(requestLatestNewsError(new Error('Request latest news failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_LATEST_NEWS = 'RECEIVE_LATEST_NEWS'
export function receiveLatestNews (news) {
  return { type: RECEIVE_LATEST_NEWS, news }
}

export const REQUEST_LATEST_NEWS_ERROR = 'REQUEST_LATEST_NEWS_ERROR'
export function requestLatestNewsError (err) {
  return { type: REQUEST_LATEST_NEWS_ERROR, err }
}

function isEqual (obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export const REQUEST_CHANGES = 'REQUEST_CHANGES'
export function requestChanges (params) {
  return (dispatch, getState) => {
    if (isEqual(getState().changesParams, params)) {
      return Promise.resolve(getState().project)
    }

    dispatch({ type: REQUEST_CHANGES, params })

    const { name, from, to } = params

    let url = `${getState().config.apiUrl}/package/${e(name)}/changes.json`
    url += `?from=${e(from)}&to=${e(to)}`

    // TODO: Cache?

    return fetch(url)
      .then((res) => {
        return res.json().then((json) => {
          if (res.ok) {
            dispatch(receiveChanges(json))
            return json
          } else {
            dispatch(requestChangesError(json))
            return Promise.reject(new Error(json.message || 'Failed to request changes'))
          }
        })
      })
      .catch((err) => {
        console.error('Failed to request changes', err)
        dispatch(requestChangesError(new Error('Request changes failed')))
        return Promise.reject(err)
      })
  }
}

export const RECEIVE_CHANGES = 'RECEIVE_CHANGES'
export function receiveChanges (changes) {
  return { type: RECEIVE_CHANGES, changes }
}

export const REQUEST_CHANGES_ERROR = 'REQUEST_CHANGES_ERROR'
export function requestChangesError (err) {
  return { type: REQUEST_CHANGES_ERROR, err }
}
