const KEY = 'pm_plan_db'
const PM_KEY = 'pm_plan_pm_status'

export function loadDB() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveDB(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export function loadPMStatus() {
  try { return JSON.parse(localStorage.getItem(PM_KEY) || '{}') } catch { return {} }
}

export function savePMStatus(status) {
  localStorage.setItem(PM_KEY, JSON.stringify(status))
}

export function completePM(serialNumber, pmIndex, engineers = []) {
  const status = loadPMStatus()
  if (!status[serialNumber]) status[serialNumber] = {}
  status[serialNumber][pmIndex] = {
    completed: true,
    completedAt: new Date().toISOString(),
    engineers: engineers.map(e => ({ id: e.id, nickname: e.nickname, fullname: e.fullname }))
  }
  savePMStatus(status)
}

export function getPMStatus(serialNumber) {
  const status = loadPMStatus()
  return status[serialNumber] || {}
}

export function countPMDone(serialNumber) {
  const s = getPMStatus(serialNumber)
  return Object.values(s).filter(v => v.completed).length
}

export function getNextPMIndex(serialNumber) {
  const s = getPMStatus(serialNumber)
  for (let i = 0; i < 8; i++) {
    if (!s[i] || !s[i].completed) return i
  }
  return -1
}
