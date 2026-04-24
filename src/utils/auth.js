const AUTH_KEY = 'pm_plan_auth'
const AUTH_USER_KEY = 'pm_plan_auth_user'
const USERS_KEY = 'pm_plan_users'

// Default admin — always exists
const DEFAULT_ADMIN = { username: 'Tony', password: 'r857jm7kX', role: 'admin', name: 'Tony (Weerayuth Chanapai)' }

export function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || 'null')
    if (!stored) {
      const defaults = [DEFAULT_ADMIN]
      localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
      return defaults
    }
    // Always ensure admin exists
    if (!stored.find(u => u.username === DEFAULT_ADMIN.username)) {
      stored.unshift(DEFAULT_ADMIN)
      localStorage.setItem(USERS_KEY, JSON.stringify(stored))
    }
    return stored
  } catch { return [DEFAULT_ADMIN] }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function login(username, password) {
  const users = getUsers()
  const user = users.find(u => u.username === username && u.password === password)
  if (user) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username: user.username, role: user.role, name: user.name }))
    return user
  }
  return null
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
}

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || 'null') } catch { return null }
}

export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}
