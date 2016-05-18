export const SET_USER = 'SET_USER'
export const SET_PROJECT = 'SET_PROJECT'

export function setUser (user) {
  return { type: SET_USER, user }
}

export function setProject (project) {
  return { type: SET_PROJECT, project }
}
