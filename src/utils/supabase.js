const SUPABASE_URL = 'https://vrztudddjeebrtsawtvh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenR1ZGRkamVlYnJ0c2F3dHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDQzNjEsImV4cCI6MjA5MjU4MDM2MX0.xSc8C9uwEgFON88YUj5758c3s8ZLDwJzFgiTvaPnpt0'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

const api = (path) => `${SUPABASE_URL}/rest/v1/${path}`

// ── Devices ──
export async function fetchDevices() {
  const pageSize = 1000
  let allRows = []
  let from = 0

  while (true) {
    const res = await fetch(api(`devices?select=*&order=no&limit=${pageSize}&offset=${from}`), { headers })
    if (!res.ok) throw new Error('Failed to fetch devices')
    const rows = await res.json()
    allRows = [...allRows, ...rows]
    if (rows.length < pageSize) break
    from += pageSize
  }

  return allRows
}

export async function upsertDevices(rows) {
  const res = await fetch(api('devices?on_conflict=serial_number'), {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows.map(r => ({
      serial_number: r.serial_number,
      cs_code: r.cs_code,
      model: r.model,
      service_type: r.service_type,
      start_date: r.start,
      end_date: r.end,
      clinic: r.clinic,
      location: r.location,
      detail: r.detail,
      province: r.province,
      map_url: r.map_url,
      remark: r.remark,
      qr_code: r.qr_code,
      sticker_date: r.sticker_date,
      pm_dates: r.pm_dates,
      no: String(r.no || ''),
    })))
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Failed to upsert devices: ' + err)
  }
  return []
}

export async function getDeviceCount() {
  const res = await fetch(api('devices?select=id'), {
    headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }
  })
  const range = res.headers.get('content-range')
  if (range && range.includes('/')) return parseInt(range.split('/')[1])
  try {
    const rows = await res.json()
    return Array.isArray(rows) ? rows.length : 0
  } catch { return 0 }
}

// ── PM Status ──
export async function fetchPMStatus(serialNumber) {
  const res = await fetch(api(`pm_status?serial_number=eq.${encodeURIComponent(serialNumber)}&select=*`), { headers })
  if (!res.ok) return {}
  const rows = await res.json()
  const result = {}
  rows.forEach(r => {
    result[r.pm_index] = {
      completed: r.completed,
      completedAt: r.completed_at,
      engineers: r.engineers || []
    }
  })
  return result
}

export async function fetchAllPMStatus() {
  const pageSize = 1000
  let allRows = []
  let from = 0

  while (true) {
    const res = await fetch(api(`pm_status?select=*&limit=${pageSize}&offset=${from}`), { headers })
    if (!res.ok) return {}
    const rows = await res.json()
    allRows = [...allRows, ...rows]
    if (rows.length < pageSize) break
    from += pageSize
  }

  const result = {}
  allRows.forEach(r => {
    if (!result[r.serial_number]) result[r.serial_number] = {}
    result[r.serial_number][r.pm_index] = {
      completed: r.completed,
      completedAt: r.completed_at,
      engineers: r.engineers || []
    }
  })
  return result
}

export async function completePMRemote(serialNumber, pmIndex, engineers = []) {
  const res = await fetch(api('pm_status'), {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      serial_number: serialNumber,
      pm_index: pmIndex,
      completed: true,
      completed_at: new Date().toISOString(),
      engineers: engineers
    })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Failed to save PM status: ' + err)
  }
  return res.json()
}
