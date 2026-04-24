import { useState, useMemo } from 'react'
import { loadDB, countPMDone, getPMStatus } from '../utils/db.js'

const REGIONS = [
  { id: 'BKK', label: 'Bangkok', color: '#00d4ff' },
  { id: 'กลาง', label: 'Central', color: '#00e5a0' },
  { id: 'ตะวันออก', label: 'East', color: '#ffd166' },
  { id: 'ตะวันตก', label: 'West', color: '#ff9f1c' },
  { id: 'เหนือ', label: 'North', color: '#c084fc' },
  { id: 'อีสาน', label: 'Northeast', color: '#f87171' },
  { id: 'ใต้', label: 'South', color: '#34d399' },
]

const BKK_AREAS = ['BKK', 'กรุงเทพกลาง', 'กรุงเทพฯ ฝั่งตะวันออก', 'กรุงเทพตะวันตก', 'กรุงเทพฝั่งเหนือ']

function pmProgress(r) {
  const done = countPMDone(r.serial_number, 8)
  return { done, total: 8, label: `${done}/8` }
}

function getDaysBetween(start, end) {
  const days = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function Planning() {
  const db = loadDB()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [step, setStep] = useState(1)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [dayPlans, setDayPlans] = useState({})
  const [exported, setExported] = useState(false)

  const days = useMemo(() => {
    if (!startDate || !endDate) return []
    const s = new Date(startDate), e = new Date(endDate)
    if (s > e) return []
    return getDaysBetween(s, e)
  }, [startDate, endDate])

  const regionDevices = useMemo(() => {
    if (!selectedRegion) return []
    if (selectedRegion === 'BKK')
      return db.filter(r => BKK_AREAS.some(a => r.location?.includes(a) || r.location === 'BKK'))
    return db.filter(r => r.location === selectedRegion)
  }, [db, selectedRegion])

  const currentDayPlan = dayPlans[activeDay] || []
  const totalSelected = Object.values(dayPlans).reduce((sum, arr) => sum + arr.length, 0)

  const toggleDevice = (serial) => {
    const current = dayPlans[activeDay] || []
    const exists = current.find(x => x.serial_number === serial)
    if (exists) {
      setDayPlans(prev => ({ ...prev, [activeDay]: current.filter(x => x.serial_number !== serial) }))
    } else {
      setDayPlans(prev => ({ ...prev, [activeDay]: [...current, { serial_number: serial }] }))
    }
  }

  const moveUp = (idx) => {
    const plan = [...currentDayPlan]
    if (idx === 0) return
    ;[plan[idx - 1], plan[idx]] = [plan[idx], plan[idx - 1]]
    setDayPlans(prev => ({ ...prev, [activeDay]: plan }))
  }

  const moveDown = (idx) => {
    const plan = [...currentDayPlan]
    if (idx === plan.length - 1) return
    ;[plan[idx], plan[idx + 1]] = [plan[idx + 1], plan[idx]]
    setDayPlans(prev => ({ ...prev, [activeDay]: plan }))
  }

  const exportPDF = () => {
    if (totalSelected === 0) return
    const regionLabel = REGIONS.find(r => r.id === selectedRegion)?.label || selectedRegion

    const dayPages = days.map((day, dayIdx) => {
      const plan = dayPlans[dayIdx] || []
      if (plan.length === 0) return ''
      const rows = plan.map((item, i) => {
        const r = db.find(d => d.serial_number === item.serial_number)
        if (!r) return ''
        const prog = pmProgress(r)
        const nextDate = prog.done < 8 ? (r.pm_dates?.[prog.done] || '-') : 'Complete'
        return `<tr>
          <td style="text-align:center;font-weight:700;font-size:16px;color:#0a3d62;">${i + 1}</td>
          <td>${r.cs_code}</td>
          <td style="font-family:monospace;font-size:11px;">${r.serial_number}</td>
          <td>${r.model}</td>
          <td><strong>${r.clinic}</strong></td>
          <td>${r.detail}</td>
          <td>${r.province}</td>
          <td style="text-align:center;">${prog.label}</td>
          <td style="text-align:center;color:${prog.done>=8?'#00b894':'#e67e22'}">${nextDate}</td>
          <td>${r.remark || ''}</td>
        </tr>`
      }).join('')

      return `<div class="day-page">
        <div class="day-header">
          <div>
            <div class="day-label">Day ${dayIdx + 1} of ${days.length}</div>
            <div class="day-date">${fmtDate(day)}</div>
          </div>
          <div class="day-stats">
            <div class="stat"><span>${plan.length}</span>Clinics</div>
            <div class="stat"><span>${regionLabel}</span>Region</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th>CS-Code</th><th>Serial No.</th><th>Model</th>
              <th>Clinic</th><th>Location</th><th>Province</th>
              <th>PM Done</th><th>Next PM</th><th>Remark</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    }).join('')

    const summaryRows = days.map((day, dayIdx) => {
      const plan = dayPlans[dayIdx] || []
      return `<tr>
        <td>Day ${dayIdx + 1}</td>
        <td>${fmtDate(day)}</td>
        <td style="text-align:center;font-weight:600;">${plan.length}</td>
        <td>${plan.map((item, i) => {
          const r = db.find(d => d.serial_number === item.serial_number)
          return r ? `${i+1}. ${r.clinic} (${r.province})` : ''
        }).filter(Boolean).join('<br>')}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Sarabun', sans-serif; font-size: 12px; color: #111; background: white; }
.cover { padding: 60px 40px; page-break-after: always; }
.cover-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #999; margin-bottom: 16px; }
.cover-title { font-size: 40px; font-weight: 700; color: #0a3d62; margin-bottom: 8px; }
.cover-region { font-size: 22px; color: #555; margin-bottom: 32px; border-bottom: 2px solid #0a3d62; padding-bottom: 24px; }
.cover-meta { display: flex; gap: 32px; flex-wrap: wrap; }
.cover-meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; }
.cover-meta-item .value { font-size: 15px; font-weight: 600; color: #0a3d62; margin-top: 2px; }
.summary-page { padding: 40px; page-break-after: always; }
.summary-page h2 { font-size: 18px; color: #0a3d62; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; }
.summary-table { width: 100%; border-collapse: collapse; }
.summary-table th { background: #0a3d62; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
.summary-table td { padding: 8px 12px; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
.summary-table tr:nth-child(even) td { background: #f8faff; }
.day-page { padding: 32px 40px; page-break-after: always; }
.day-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #0a3d62; }
.day-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #0a3d62; font-weight: 700; }
.day-date { font-size: 22px; font-weight: 700; color: #111; margin-top: 4px; }
.day-stats { display: flex; gap: 16px; }
.stat { text-align: center; background: #f0f7ff; border-radius: 8px; padding: 8px 16px; font-size: 11px; color: #666; }
.stat span { display: block; font-size: 18px; font-weight: 700; color: #0a3d62; }
table { width: 100%; border-collapse: collapse; }
th { background: #0a3d62; color: white; padding: 8px 10px; text-align: left; font-size: 10px; letter-spacing: 0.04em; }
td { padding: 8px 10px; border-bottom: 1px solid #e8e8e8; font-size: 11px; vertical-align: top; }
tr:nth-child(even) td { background: #f8faff; }
@media print { @page { margin: 10mm; size: A4 landscape; } }
</style></head><body>
<div class="cover">
  <div class="cover-label">Wontech Asia · Preventive Maintenance</div>
  <div class="cover-title">PM Visit Plan</div>
  <div class="cover-region">${regionLabel} Region</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><div class="label">Start Date</div><div class="value">${fmtDate(days[0])}</div></div>
    <div class="cover-meta-item"><div class="label">End Date</div><div class="value">${fmtDate(days[days.length-1])}</div></div>
    <div class="cover-meta-item"><div class="label">Total Days</div><div class="value">${days.length}</div></div>
    <div class="cover-meta-item"><div class="label">Total Clinics</div><div class="value">${totalSelected}</div></div>
    <div class="cover-meta-item"><div class="label">Generated</div><div class="value">${new Date().toLocaleDateString('th-TH')}</div></div>
  </div>
</div>
<div class="summary-page">
  <h2>Trip Summary</h2>
  <table class="summary-table">
    <thead><tr><th>Day</th><th>Date</th><th>Clinics</th><th>Visit Order</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
</div>
${dayPages}
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 800)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  const S = styles

  if (step === 1) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.breadcrumb}><span style={S.tag}>02</span> Planning</div>
          <h1 style={S.title}>Plan PM Visits</h1>
          <p style={S.sub}>Set your travel dates, then build a day-by-day clinic visit plan.</p>
        </div>
        {db.length === 0 ? (
          <div style={{ ...S.card, padding: 32, textAlign: 'center', color: 'var(--text2)' }}>No devices in database. Go to <strong>Update Database</strong> first.</div>
        ) : (
          <div style={{ maxWidth: 480 }}>
            <div style={S.card}>
              <div style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Set Travel Dates</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={S.label}>Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={S.input} />
                  </div>
                </div>
                {days.length > 0 && (
                  <div style={{ marginTop: 20, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>{days.length} day{days.length > 1 ? 's' : ''} planned</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {days.map((d, i) => (
                        <span key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                          D{i+1} {fmtDateShort(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button className="btn btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center', height: 42 }} disabled={days.length === 0} onClick={() => setStep(2)}>
                  Continue to Planning →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={S.breadcrumb}><span style={S.tag}>02</span> Planning</div>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '2px 10px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>← Change Dates</button>
        </div>
        <h1 style={S.title}>Day-by-Day Planning</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtDate(days[0])} → {fmtDate(days[days.length-1])}</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{days.length}d · {totalSelected} clinics</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: Day tabs + order */}
        <div style={{ width: 230, flexShrink: 0 }}>
          <div style={S.card}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Days</div>
            {days.map((d, i) => {
              const cnt = (dayPlans[i] || []).length
              const active = activeDay === i
              return (
                <button key={i} onClick={() => setActiveDay(i)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: active ? 'var(--accent-dim)' : 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border)', color: active ? 'var(--accent)' : 'var(--text2)',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>Day {i+1}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmtDateShort(d)}</div>
                  </div>
                  {cnt > 0 && <span style={{ background: active ? 'var(--accent)' : 'var(--bg3)', color: active ? '#000' : 'var(--text3)', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{cnt}</span>}
                </button>
              )
            })}
          </div>

          {currentDayPlan.length > 0 && (
            <div style={{ ...S.card, marginTop: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day {activeDay+1} Visit Order</div>
              {currentDayPlan.map((item, idx) => {
                const r = db.find(d => d.serial_number === item.serial_number)
                if (!r) return null
                return (
                  <div key={item.serial_number} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{idx+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.province}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => moveUp(idx)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text3)', cursor: 'pointer', padding: '0 5px', fontSize: 10 }}>▲</button>
                      <button onClick={() => moveDown(idx)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text3)', cursor: 'pointer', padding: '0 5px', fontSize: 10 }}>▼</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalSelected > 0 && (
            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center', height: 40 }} onClick={exportPDF}>
              {exported ? '✓ Exported!' : '↓ Export PDF Plan'}
            </button>
          )}
        </div>

        {/* Right: Region + devices */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {REGIONS.map(r => {
              const count = r.id === 'BKK' ? db.filter(d => BKK_AREAS.some(a => d.location?.includes(a) || d.location === 'BKK')).length : db.filter(d => d.location === r.id).length
              const active = selectedRegion === r.id
              return (
                <button key={r.id} onClick={() => setSelectedRegion(r.id)} style={{
                  background: active ? `${r.color}18` : 'var(--bg1)', border: `1px solid ${active ? r.color : 'var(--border)'}`,
                  borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: active ? r.color : 'var(--text2)',
                  fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, transition: 'all 0.15s'
                }}>
                  <span style={{ fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {selectedRegion && (
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{REGIONS.find(r => r.id === selectedRegion)?.label} — {regionDevices.length} devices</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Click row to add/remove from Day {activeDay+1}</span>
              </div>
              <div style={{ overflow: 'auto', maxHeight: '62vh' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Day</th>
                      <th style={S.th}>#</th>
                      <th style={S.th}>CS-Code</th>
                      <th style={S.th}>Serial</th>
                      <th style={S.th}>Clinic</th>
                      <th style={S.th}>District</th>
                      <th style={S.th}>Province</th>
                      <th style={S.th}>PM Done</th>
                      <th style={S.th}>Next PM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionDevices.map((r, i) => {
                      const prog = pmProgress(r)
                      const nextDate = prog.done < 8 ? (r.pm_dates?.[prog.done] || '-') : 'All Done'
                      let assignedDayIdx = -1, assignedOrder = -1
                      Object.entries(dayPlans).forEach(([dayIdx, arr]) => {
                        const found = arr.findIndex(x => x.serial_number === r.serial_number)
                        if (found >= 0) { assignedDayIdx = parseInt(dayIdx); assignedOrder = found + 1 }
                      })
                      const isCurrentDay = assignedDayIdx === activeDay
                      const isOtherDay = assignedDayIdx >= 0 && !isCurrentDay
                      return (
                        <tr key={i} onClick={() => !isOtherDay && toggleDevice(r.serial_number)} style={{
                          cursor: isOtherDay ? 'not-allowed' : 'pointer',
                          background: isCurrentDay ? 'var(--accent-dim)' : 'transparent',
                          opacity: isOtherDay ? 0.45 : 1, transition: 'background 0.1s'
                        }}>
                          <td style={S.td}>
                            {assignedDayIdx >= 0
                              ? <span style={{ background: isCurrentDay ? 'var(--accent)' : 'var(--bg3)', color: isCurrentDay ? '#000' : 'var(--text3)', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontFamily: 'var(--mono)' }}>D{assignedDayIdx+1}</span>
                              : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>
                            }
                          </td>
                          <td style={S.td}>
                            {assignedOrder > 0 && <span style={{ width: 22, height: 22, borderRadius: 5, background: isCurrentDay ? 'var(--accent)' : 'var(--bg3)', color: isCurrentDay ? '#000' : 'var(--text3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{assignedOrder}</span>}
                          </td>
                          <td style={S.td}><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{r.cs_code}</span></td>
                          <td style={S.td}><span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.serial_number}</span></td>
                          <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</td>
                          <td style={S.td}>{r.detail}</td>
                          <td style={S.td}>{r.province}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{prog.label}</span>
                              <div style={{ display: 'flex', gap: 1, marginLeft: 4 }}>
                                {Array(8).fill(0).map((_, idx) => (
                                  <div key={idx} style={{ width: 5, height: 5, borderRadius: 1, background: idx < prog.done ? 'var(--green)' : 'var(--bg3)' }} />
                                ))}
                              </div>
                            </div>
                          </td>
                          <td style={S.td}><span style={{ fontSize: 11, color: prog.done >= 8 ? 'var(--green)' : 'var(--yellow)' }}>{nextDate}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1300, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 24 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3)' },
  tag: { background: 'var(--green-dim)', color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--text2)' },
  card: { background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  label: { display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  input: { width: '100%', height: 40, padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
  td: { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' },
}
