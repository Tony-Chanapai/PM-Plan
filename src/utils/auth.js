const AUTH_KEY = 'pm_plan_auth'

export const CREDENTIALS = { username: 'Tony', password: 'r857jm7kX' }

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function login(username, password) {
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY)
}
