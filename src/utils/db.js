import { fetchDevices, fetchAllPMStatus, fetchPMStatus, completePMRemote } from './supabase.js'

// ── Local cache to avoid re-fetching on every render ──
let _deviceCache = null
let _pmCache = null

export async function loadDB() {
  if (_deviceCache) return _deviceCache
  try {
    const rows = await fetchDevices()
    _deviceCache = rows.map(r => ({
      ...r,
      start: r.start_date,
      end: r.end_date,
      pm_dates: r.pm_dates || [],
    }))
    return _deviceCache
  } catch { return [] }
}

export function clearDBCache() {
  _deviceCache = null
  _pmCache = null
}

export async function loadAllPMStatus() {
  if (_pmCache) return _pmCache
  try {
    _pmCache = await fetchAllPMStatus()
    return _pmCache
  } catch { return {} }
}

export async function getPMStatusAsync(serialNumber) {
  try { return await fetchPMStatus(serialNumber) }
  catch { return {} }
}

export function getPMStatus(serialNumber) {
  if (!_pmCache) return {}
  return _pmCache[serialNumber] || {}
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

export async function completePM(serialNumber, pmIndex, engineers = []) {
  const result = await completePMRemote(serialNumber, pmIndex, engineers)
  // Update local cache
  if (!_pmCache) _pmCache = {}
  if (!_pmCache[serialNumber]) _pmCache[serialNumber] = {}
  _pmCache[serialNumber][pmIndex] = {
    completed: true,
    completedAt: new Date().toISOString(),
    engineers
  }
  return result
}
