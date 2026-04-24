import { useState, useMemo, useEffect } from 'react'
import { loadDB, countPMDone, loadAllPMStatus } from '../utils/db.js'

const REGIONS = [
  { id: 'BKK', label: 'Bangkok', icon: '🏙', color: '#00d4ff' },
  { id: 'กลาง', label: 'Central', icon: '🌆', color: '#00e5a0' },
  { id: 'ตะวันออก', label: 'East', icon: '🌅', color: '#ffd166' },
  { id: 'ตะวันตก', label: 'West', icon: '🌄', color: '#ff9f1c' },
  { id: 'เหนือ', label: 'North', icon: '🏔', color: '#c084fc' },
  { id: 'อีสาน', label: 'Northeast', icon: '🌾', color: '#f87171' },
  { id: 'ใต้', label: 'South', icon: '🌊', color: '#34d399' },
]
const BKK_AREAS = ['BKK','กรุงเทพกลาง','กรุงเทพฯ ฝั่งตะวันออก','กรุงเทพตะวันตก','กรุงเทพฝั่งเหนือ']

const getDays = (s, e) => { const days=[],cur=new Date(s),last=new Date(e); while(cur<=last){days.push(new Date(cur));cur.setDate(cur.getDate()+1)} return days }
const fmtDate = d => d.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})
const fmtShort = d => d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
const pmDone = r => countPMDone(r.serial_number)

function usePlanning() {
  const [db, setDb] = useState([])
  const [dbLoading, setDbLoading] = useState(true)
  const [step, setStep] = useState(1)

  useEffect(() => {
    Promise.all([loadDB(), loadAllPMStatus()]).then(([devices]) => {
      setDb(devices)
      setDbLoading(false)
    }).catch(() => setDbLoading(false))
  }, [])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [dayPlans, setDayPlans] = useState({})
  const [exported, setExported] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('province')
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const days = useMemo(() => {
    if (!startDate || !endDate) return []
    const s = new Date(startDate), e = new Date(endDate)
    return s > e ? [] : getDays(s, e)
  }, [startDate, endDate])

  const regionDevices = useMemo(() => {
    if (!selectedRegion) return []
    return selectedRegion === 'BKK'
      ? db.filter(r => BKK_AREAS.some(a => r.location?.includes(a) || r.location === 'BKK'))
      : db.filter(r => r.location === selectedRegion)
  }, [db, selectedRegion])

  const currentDayPlan = dayPlans[activeDay] || []
  const totalSelected = Object.values(dayPlans).reduce((s, a) => s + a.length, 0)

  const filteredDevices = useMemo(() => {
    let list = regionDevices
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.clinic?.toLowerCase().includes(q) ||
        r.serial_number?.toLowerCase().includes(q) ||
        r.cs_code?.toLowerCase().includes(q) ||
        r.province?.toLowerCase().includes(q) ||
        r.detail?.toLowerCase().includes(q) ||
        r.model?.toLowerCase().includes(q)
      )
    }
    if (sortBy !== 'none') {
      const key = sortBy === 'district' ? 'detail' : sortBy
      list = [...list].sort((a, b) => {
        const av = (a[key] || '').toLowerCase()
        const bv = (b[key] || '').toLowerCase()
        return sortDir === 'asc' ? av.localeCompare(bv, 'th') : bv.localeCompare(av, 'th')
      })
    }
    return list
  }, [regionDevices, search, sortBy, sortDir])

  const toggleDevice = (serial) => {
    const cur = dayPlans[activeDay] || []
    const exists = cur.find(x => x.serial_number === serial)
    setDayPlans(prev => ({ ...prev, [activeDay]: exists ? cur.filter(x => x.serial_number !== serial) : [...cur, { serial_number: serial }] }))
  }

  const moveUp = (idx) => { const p=[...currentDayPlan]; if(idx===0)return; [p[idx-1],p[idx]]=[p[idx],p[idx-1]]; setDayPlans(prev=>({...prev,[activeDay]:p})) }
  const moveDown = (idx) => { const p=[...currentDayPlan]; if(idx===p.length-1)return; [p[idx],p[idx+1]]=[p[idx+1],p[idx]]; setDayPlans(prev=>({...prev,[activeDay]:p})) }

  const getDeviceInfo = (serial) => db.find(d => d.serial_number === serial)
  const getAssignment = (serial) => { let day=-1,order=-1; Object.entries(dayPlans).forEach(([di,arr])=>{ const fi=arr.findIndex(x=>x.serial_number===serial); if(fi>=0){day=parseInt(di);order=fi+1} }); return {day,order} }

  const exportPDF = () => {
    if (!totalSelected) return
    const regionLabel = REGIONS.find(r => r.id === selectedRegion)?.label || selectedRegion
    const dayPages = days.map((day, di) => {
      const plan = dayPlans[di] || []
      if (!plan.length) return ''
      const rows = plan.map((item, i) => {
        const r = db.find(d => d.serial_number === item.serial_number)
        if (!r) return ''
        const done = pmDone(r)
        const next = done < 8 ? (r.pm_dates?.[done] || '-') : 'Complete'
        return `<tr><td style="text-align:center;font-weight:700;font-size:15px;color:#0a3d62">${i+1}</td><td>${r.cs_code}</td><td style="font-family:monospace;font-size:11px">${r.serial_number}</td><td>${r.model}</td><td><strong>${r.clinic}</strong></td><td>${r.detail}</td><td>${r.province}</td><td style="text-align:center">${done}/8</td><td style="color:${done>=8?'#00b894':'#e67e22'}">${next}</td><td>${r.remark||''}</td></tr>`
      }).join('')
      return `<div class="dp"><div class="dh"><div><div class="dl">Day ${di+1} of ${days.length}</div><div class="dd">${fmtDate(day)}</div></div><div class="ds"><div class="st"><span>${plan.length}</span>Clinics</div><div class="st"><span>${regionLabel}</span>Region</div></div></div><table><thead><tr><th>#</th><th>CS-Code</th><th>Serial</th><th>Model</th><th>Clinic</th><th>Location</th><th>Province</th><th>PM</th><th>Next PM</th><th>Remark</th></tr></thead><tbody>${rows}</tbody></table></div>`
    }).join('')
    const sumRows = days.map((day,di)=>{ const p=dayPlans[di]||[]; return `<tr><td>Day ${di+1}</td><td>${fmtDate(day)}</td><td style="text-align:center;font-weight:600">${p.length}</td><td>${p.map((item,i)=>{const r=db.find(d=>d.serial_number===item.serial_number);return r?`${i+1}. ${r.clinic} (${r.province})`:''}).filter(Boolean).join('<br>')}</td></tr>` }).join('')
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Sarabun',sans-serif;font-size:12px;color:#111}.cv{padding:50px 40px;page-break-after:always}.cvl{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#999;margin-bottom:12px}.cvt{font-size:38px;font-weight:700;color:#0a3d62;margin-bottom:6px}.cvr{font-size:20px;color:#555;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #0a3d62}.cvm{display:flex;gap:24px;flex-wrap:wrap}.cvm .l{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#999}.cvm .v{font-size:14px;font-weight:600;color:#0a3d62;margin-top:2px}.sm{padding:36px;page-break-after:always}.sm h2{font-size:16px;color:#0a3d62;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e0e0e0}.st2{width:100%;border-collapse:collapse}.st2 th{background:#0a3d62;color:#fff;padding:8px 10px;text-align:left;font-size:11px}.st2 td{padding:7px 10px;border-bottom:1px solid #e8e8e8;vertical-align:top}.st2 tr:nth-child(even) td{background:#f8faff}.dp{padding:28px 40px;page-break-after:always}.dh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #0a3d62}.dl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#0a3d62;font-weight:700}.dd{font-size:20px;font-weight:700;color:#111;margin-top:3px}.ds{display:flex;gap:12px}.st{text-align:center;background:#f0f7ff;border-radius:8px;padding:7px 12px;font-size:11px;color:#666}.st span{display:block;font-size:16px;font-weight:700;color:#0a3d62}table{width:100%;border-collapse:collapse}th{background:#0a3d62;color:#fff;padding:7px 9px;text-align:left;font-size:10px;letter-spacing:.04em}td{padding:7px 9px;border-bottom:1px solid #e8e8e8;font-size:11px;vertical-align:top}tr:nth-child(even) td{background:#f8faff}.sig-block{display:flex;gap:60px;margin-top:40px;padding-top:24px;border-top:2px solid #e0e0e0}.sig-item{flex:1;text-align:center}.sig-line{width:100%;height:50px;border-bottom:1.5px solid #333;margin-bottom:10px}.sig-label{font-size:13px;font-weight:700;color:#0a3d62;margin-bottom:8px}.sig-name{font-size:11px;color:#555;margin-top:6px;text-align:left}@media print{@page{margin:10mm;size:A4 landscape}}</style></head><body><div class="cv"><div class="cvl">Wontech Asia · Preventive Maintenance</div><div class="cvt">PM Visit Plan</div><div class="cvr">${regionLabel} Region</div><div class="cvm"><div><div class="l">Start</div><div class="v">${fmtDate(days[0])}</div></div><div><div class="l">End</div><div class="v">${fmtDate(days[days.length-1])}</div></div><div><div class="l">Days</div><div class="v">${days.length}</div></div><div><div class="l">Clinics</div><div class="v">${totalSelected}</div></div><div><div class="l">Generated</div><div class="v">${new Date().toLocaleDateString('th-TH')}</div></div></div></div><div class="sm"><h2>Trip Summary</h2><table class="st2"><thead><tr><th>Day</th><th>Date</th><th>Clinics</th><th>Visit Order</th></tr></thead><tbody>${sumRows}</tbody></table><div class="sig-block"><div class="sig-item"><div class="sig-line"></div><div class="sig-label">Engineer Signature</div><div class="sig-name">Name: ________________________________</div><div class="sig-name">Date: &nbsp; ______ / ______ / ______</div></div><div class="sig-item"><div class="sig-line"></div><div class="sig-label">CS Manager Signature</div><div class="sig-name">Name: ________________________________</div><div class="sig-name">Date: &nbsp; ______ / ______ / ______</div></div></div></div>${dayPages}</body></html>`
    const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),800)
    setExported(true); setTimeout(()=>setExported(false),3000)
  }

  return { db, dbLoading, step, setStep, startDate, setStartDate, endDate, setEndDate, days, selectedRegion, setSelectedRegion, activeDay, setActiveDay, dayPlans, currentDayPlan, totalSelected, regionDevices, filteredDevices, search, setSearch, sortBy, sortDir, toggleSort, toggleDevice, moveUp, moveDown, getDeviceInfo, getAssignment, exported, exportPDF }
}

function DateStep({ startDate, setStartDate, endDate, setEndDate, days, onNext, db, dbLoading }) {
  const inputStyle = {
    width: '100%', height: 48, padding: '0 14px',
    background: '#ffffff', border: '1px solid #ccd4e0',
    borderRadius: 12, color: '#111827', outline: 'none',
    colorScheme: 'light',
  }
  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <span className="tag-mono badge-green" style={{ marginBottom: 10, display: 'inline-block' }}>02 · Planning</span>
        <h1 className="page-title">Plan PM Visits</h1>
        <p className="page-sub">Set travel dates then build your day-by-day visit plan.</p>
      </div>
      {db.length === 0 && !dbLoading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text2)' }}>No devices in database. Import Excel first.</div>
      ) : dbLoading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="spin" /> Loading devices…
        </div>
      ) : (
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Set Travel Dates</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={inputStyle} />
            </div>
          </div>
          {days.length > 0 && (
            <div style={{ marginTop: 14, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>{days.length} day{days.length > 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {days.map((d, i) => <span key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>D{i+1} {fmtShort(d)}</span>)}
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-full" style={{ marginTop: 18, height: 50, fontSize: 15 }} disabled={days.length === 0} onClick={onNext}>Continue →</button>
        </div>
      )}
    </div>
  )
}

function RegionPicker({ db, selectedRegion, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
      {REGIONS.map(r => {
        const count = r.id === 'BKK' ? db.filter(d => BKK_AREAS.some(a => d.location?.includes(a)||d.location==='BKK')).length : db.filter(d => d.location===r.id).length
        const active = selectedRegion === r.id
        return (
          <button key={r.id} onClick={() => onSelect(r.id)} style={{ background: active ? `${r.color}18` : 'var(--bg1)', border: `1px solid ${active ? r.color : 'var(--border)'}`, borderRadius: 12, padding: '12px 6px', cursor: 'pointer', color: active ? r.color : 'var(--text2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 20 }}>{r.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>{r.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: active ? r.color : 'var(--text3)' }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function DayTabs({ days, dayPlans, activeDay, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
      {days.map((d, i) => {
        const cnt = (dayPlans[i] || []).length
        const active = activeDay === i
        return (
          <button key={i} onClick={() => onSelect(i)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, background: active ? 'var(--accent-dim)' : 'var(--bg1)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, color: active ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
            <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>Day {i+1}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: active ? 'var(--accent)' : 'var(--text3)' }}>{fmtShort(d)}</span>
            {cnt > 0 && <span style={{ background: active ? 'var(--accent)' : 'var(--bg3)', color: active ? '#000' : 'var(--text3)', borderRadius: 8, padding: '0 7px', fontSize: 10 }}>{cnt}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function Planning() {
  const p = usePlanning()
  const [showOrder, setShowOrder] = useState(false)

  if (p.step === 1) return (
    <>
      <div className="desktop-only">
        <div className="desktop-page-sm"><DateStep {...p} onNext={() => p.setStep(2)} /></div>
      </div>
      <div className="mobile-only">
        <div className="mobile-page"><DateStep {...p} onNext={() => p.setStep(2)} /></div>
      </div>
    </>
  )

  const DeviceRow = ({ r, isMobile }) => {
    const { day, order } = p.getAssignment(r.serial_number)
    const isCurrent = day === p.activeDay
    const isOther = day >= 0 && !isCurrent
    const done = pmDone(r)
    const next = done < 8 ? (r.pm_dates?.[done] || '-') : 'Done'

    if (isMobile) return (
      <div onClick={() => !isOther && p.toggleDevice(r.serial_number)} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: isCurrent ? 'var(--accent-dim)' : 'transparent', opacity: isOther ? 0.4 : 1, cursor: isOther ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: day >= 0 ? (isCurrent ? 'var(--accent)' : 'var(--bg3)') : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCurrent ? '#000' : 'var(--text3)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{day >= 0 ? (isCurrent ? order : `D${day+1}`) : '+'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.province} · <span style={{ fontFamily: 'var(--mono)' }}>{r.cs_code}</span></div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 1, justifyContent: 'flex-end', marginBottom: 2 }}>{Array(8).fill(0).map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:1,background:i<done?'var(--green)':'var(--bg3)'}}/>)}</div>
          <div style={{ fontSize: 10, color: done>=8?'var(--green)':'var(--yellow)', whiteSpace: 'nowrap' }}>{next}</div>
        </div>
      </div>
    )

    return (
      <tr onClick={() => !isOther && p.toggleDevice(r.serial_number)} style={{ cursor: isOther ? 'not-allowed' : 'pointer', background: isCurrent ? 'var(--accent-dim)' : 'transparent', opacity: isOther ? 0.4 : 1 }}>
        <td><span style={{ background: day>=0?(isCurrent?'var(--accent)':'var(--bg3)'):'transparent', color: isCurrent?'#000':'var(--text3)', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontFamily: 'var(--mono)' }}>{day>=0?`D${day+1}`:'—'}</span></td>
        <td>{order>0&&<span style={{width:22,height:22,borderRadius:5,background:isCurrent?'var(--accent)':'var(--bg3)',color:isCurrent?'#000':'var(--text3)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11}}>{order}</span>}</td>
        <td><span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)'}}>{r.cs_code}</span></td>
        <td><span style={{fontFamily:'var(--mono)',fontSize:11}}>{r.serial_number}</span></td>
        <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{r.clinic}</td>
        <td>{r.detail}</td>
        <td>{r.province}</td>
        <td><div style={{display:'flex',gap:1}}>{Array(8).fill(0).map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:1,background:i<done?'var(--green)':'var(--bg3)'}}/>)}</div><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>{done}/8</span></td>
        <td><span style={{fontSize:11,color:done>=8?'var(--green)':'var(--yellow)'}}>{next}</span></td>
      </tr>
    )
  }

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="desktop-only">
        
        <div className="desktop-page" style={{ maxWidth: 1300 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="tag-mono badge-green">02 · Planning</span>
              <button onClick={() => p.setStep(1)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>← Change Dates</button>
            </div>
            <h1 className="page-title">Day-by-Day Planning</h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtDate(p.days[0])} → {fmtDate(p.days[p.days.length-1])}</span>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{p.days.length}d · {p.totalSelected} clinics</span>
              {p.totalSelected > 0 && <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={p.exportPDF}>{p.exported ? '✓ Done!' : '↓ Export PDF'}</button>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'start' }}>
            {/* Left: Day tabs + order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Days</div>
                {p.days.map((d, i) => {
                  const cnt = (p.dayPlans[i] || []).length
                  const active = p.activeDay === i
                  return (
                    <button key={i} onClick={() => p.setActiveDay(i)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: active ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: active ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><div style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>Day {i+1}</div><div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmtShort(d)}</div></div>
                      {cnt > 0 && <span style={{ background: active ? 'var(--accent)' : 'var(--bg3)', color: active ? '#000' : 'var(--text3)', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{cnt}</span>}
                    </button>
                  )
                })}
              </div>

              {p.currentDayPlan.length > 0 && (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day {p.activeDay+1} Order</div>
                  {p.currentDayPlan.map((item, idx) => {
                    const r = p.getDeviceInfo(item.serial_number)
                    if (!r) return null
                    return (
                      <div key={item.serial_number} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx+1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.province}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => p.moveUp(idx)} style={{ width: 24, height: 22, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', cursor: 'pointer', fontSize: 10 }}>▲</button>
                          <button onClick={() => p.moveDown(idx)} style={{ width: 24, height: 22, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', cursor: 'pointer', fontSize: 10 }}>▼</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Region + devices */}
            <div>
              <RegionPicker db={p.db} selectedRegion={p.selectedRegion} onSelect={(r) => { p.setSelectedRegion(r); p.setSearch("") }} />
              {p.selectedRegion && (
                <div className="card" style={{ marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{REGIONS.find(r=>r.id===p.selectedRegion)?.label} — {p.regionDevices.length} devices</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>Click to add to Day {p.activeDay+1}</span>
                {/* Sort buttons */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {[['province','Province'],['district','District'],['clinic','Clinic']].map(([key,label]) => (
                    <button key={key} onClick={() => p.toggleSort(key)} style={{
                      height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid',
                      borderColor: p.sortBy === key ? 'var(--accent)' : 'var(--border2)',
                      background: p.sortBy === key ? 'var(--accent-dim)' : 'var(--bg2)',
                      color: p.sortBy === key ? 'var(--accent)' : 'var(--text2)',
                      fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
                    }}>
                      {label} {p.sortBy === key && <span>{p.sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 10, fontSize: 14, color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
                  <input
                    value={p.search} onChange={e => p.setSearch(e.target.value)}
                    placeholder="Search clinic, serial, province…"
                    style={{ height: 34, padding: '0 12px 0 32px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12, outline: 'none', width: 240 }}
                  />
                  {p.search && <button onClick={() => p.setSearch('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
                </div>
                {p.search && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.filteredDevices.length} of {p.regionDevices.length}</span>}
              </div>
                  <div className="tbl-wrap" style={{ maxHeight: '55vh' }}>
                    <table>
                      <thead>
                        <tr>
                          {[
                            { key: 'day', label: 'Day' },
                            { key: 'order', label: '#' },
                            { key: 'cs_code', label: 'CS-Code' },
                            { key: 'serial_number', label: 'Serial' },
                            { key: 'clinic', label: 'Clinic', sortable: true },
                            { key: 'district', label: 'District', sortable: true },
                            { key: 'province', label: 'Province', sortable: true },
                            { key: 'pm', label: 'PM' },
                            { key: 'next', label: 'Next PM' },
                          ].map(col => (
                            <th key={col.key}
                              onClick={col.sortable ? () => p.toggleSort(col.key) : undefined}
                              style={{
                                cursor: col.sortable ? 'pointer' : 'default',
                                userSelect: 'none',
                                color: p.sortBy === col.key ? 'var(--accent)' : undefined,
                                background: p.sortBy === col.key ? 'rgba(0,212,255,0.08)' : undefined,
                              }}>
                              {col.label}
                              {col.sortable && (
                                <span style={{ marginLeft: 4, fontSize: 10, opacity: p.sortBy === col.key ? 1 : 0.4 }}>
                                  {p.sortBy === col.key ? (p.sortDir === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{p.filteredDevices.map((r, i) => <DeviceRow key={i} r={r} isMobile={false} />)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="mobile-only">
        <div className="mobile-page">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="tag-mono badge-green">02</span>
              <button onClick={() => p.setStep(1)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>← Dates</button>
              {p.totalSelected > 0 && <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={p.exportPDF}>{p.exported ? '✓' : '↓ PDF'}</button>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtShort(p.days[0])} → {fmtShort(p.days[p.days.length-1])} · <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{p.totalSelected} clinics</span></div>
          </div>

          <DayTabs days={p.days} dayPlans={p.dayPlans} activeDay={p.activeDay} onSelect={p.setActiveDay} />

          {/* Day order collapsible */}
          {p.currentDayPlan.length > 0 && (
            <div className="card" style={{ marginTop: 12, overflow: 'hidden' }}>
              <button onClick={() => setShowOrder(v => !v)} style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                Day {p.activeDay+1} Visit Order ({p.currentDayPlan.length})
                <span style={{ color: 'var(--text3)' }}>{showOrder ? '▲' : '▼'}</span>
              </button>
              {showOrder && p.currentDayPlan.map((item, idx) => {
                const r = p.getDeviceInfo(item.serial_number)
                if (!r) return null
                return (
                  <div key={item.serial_number} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.province}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => p.moveUp(idx)} style={{ width: 30, height: 30, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 11 }}>▲</button>
                      <button onClick={() => p.moveDown(idx)} style={{ width: 30, height: 30, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 11 }}>▼</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <RegionPicker db={p.db} selectedRegion={p.selectedRegion} onSelect={(r) => { p.setSelectedRegion(r); p.setSearch("") }} />
          </div>

          {p.selectedRegion && (
            <div className="card" style={{ marginTop: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  {REGIONS.find(r=>r.id===p.selectedRegion)?.label} · Tap to add to Day {p.activeDay+1}
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 10, fontSize: 14, color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
                  <input
                    value={p.search} onChange={e => p.setSearch(e.target.value)}
                    placeholder="Search clinic, serial, province…"
                    style={{ width: '100%', height: 38, padding: '0 32px 0 32px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }}
                  />
                  {p.search && <button onClick={() => p.setSearch('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
                </div>
                {/* Sort buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>Sort:</span>
                  {[['province', 'Province'], ['district', 'District'], ['clinic', 'Clinic']].map(([key, label]) => (
                    <button key={key} onClick={() => p.toggleSort(key)} style={{
                      height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid',
                      borderColor: p.sortBy === key ? 'var(--accent)' : 'var(--border2)',
                      background: p.sortBy === key ? 'var(--accent-dim)' : 'var(--bg2)',
                      color: p.sortBy === key ? 'var(--accent)' : 'var(--text2)',
                      fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      {label}
                      {p.sortBy === key && <span style={{ fontSize: 10 }}>{p.sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ))}
                </div>
                {p.search && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{p.filteredDevices.length} of {p.regionDevices.length} results</div>}
              </div>
              {p.filteredDevices.map((r, i) => <DeviceRow key={i} r={r} isMobile={true} />)}
              {p.filteredDevices.length === 0 && (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No results for "{p.search}"</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
