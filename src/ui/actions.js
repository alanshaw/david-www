export const SET_CONFIG = 'SET_CONFIG'
export const SET_USER = 'SET_USER'
export const SET_PROJECT = 'SET_PROJECT'

export function setConfig (user) {
  return { type: SET_CONFIG, user }
}

export function setUser (user) {
  return { type: SET_USER, user }
}

export function setProject (project) {
  return { type: SET_PROJECT, project }
}
