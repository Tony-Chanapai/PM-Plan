import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { loadDB, getPMStatus, completePM, getNextPMIndex, loadAllPMStatus } from '../utils/db.js'
import { ENGINEERS } from '../utils/engineers.js'

const PM_LABELS = ['3 Month','6 Month','9 Month','12 Month','15 Month','18 Month','21 Month','24 Month (Final)']

// ── Isolated search panel — has its own input state, no parent re-render while typing ──
const SearchPanel = memo(({ onSearch, notFound, scanning, onToggleScan }) => {
  const [val, setVal] = useState('')

  const handleSearch = () => onSearch(val)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 20 }}>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Serial Number or QR Code</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. B4OLG302-1856"
            autoCapitalize="none" autoCorrect="off" autoComplete="off"
            style={{ flex: 1, height: 46, padding: '0 14px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)' }}
          />
          <button className="btn btn-primary" style={{ height: 46, padding: '0 18px', flexShrink: 0 }} onClick={handleSearch}>Search</button>
        </div>
        {notFound && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--red)' }}>⚠ Device not found. Check the serial number.</p>}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
        <button className="btn btn-full" style={{ height: 46 }} onClick={onToggleScan}>
          {scanning ? '⏹ Stop Scanner' : '📷 Scan QR Code'}
        </button>
      </div>
      {scanning && (
        <div style={{ padding: '0 20px 20px' }}>
          <div id="qr-reader" style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }} />
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>Point camera at QR code</p>
        </div>
      )}
    </div>
  )
})

// ── Engineer picker ──
const EngineerPicker = memo(({ selected, onToggle }) => (
  <div>
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      Select Engineers
      {selected.length > 0 && <span className="badge-green">{selected.length} selected</span>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {ENGINEERS.map(e => {
        const sel = selected.includes(e.id)
        return (
          <button key={e.id} onClick={() => onToggle(e.id)} style={{
            padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
            background: sel ? 'var(--green-dim)' : 'var(--bg2)',
            border: `1px solid ${sel ? 'rgba(0,229,160,0.3)' : 'var(--border2)'}`,
            color: sel ? 'var(--green)' : 'var(--text2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{e.nickname}</span>
            <span style={{ fontSize: 9, color: sel ? 'rgba(0,229,160,0.7)' : 'var(--text3)', lineHeight: 1.2 }}>{e.fullname.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  </div>
))

// ── PM Rounds ──
const PMRounds = memo(({ device, selectedEngineers, onConfirm, refresh }) => {
  const pmStatus = getPMStatus(device.serial_number)
  const nextIdx = getNextPMIndex(device.serial_number)
  const donePMs = Object.values(pmStatus).filter(v => v.completed).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>PM Progress</span>
        <span className="badge-accent" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{donePMs}/8</span>
        {donePMs >= 8 && <span className="badge-green">All Complete ✓</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PM_LABELS.map((label, idx) => {
          const done = pmStatus[idx]?.completed
          const isNext = idx === nextIdx
          const date = device.pm_dates?.[idx] || ''
          const completedEng = pmStatus[idx]?.engineers || []
          return (
            <div key={idx} style={{
              borderRadius: 12, border: '1px solid',
              borderColor: done ? 'rgba(0,229,160,0.2)' : isNext ? 'rgba(0,212,255,0.3)' : 'var(--border)',
              background: done ? 'var(--green-dim)' : isNext ? 'var(--accent-dim)' : 'var(--bg2)',
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--green)' : isNext ? 'var(--accent)' : 'var(--bg3)', color: done || isNext ? '#000' : 'var(--text3)', fontWeight: 700, fontSize: 12 }}>
                {done ? '✓' : idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isNext ? 600 : 400, color: done ? 'var(--green)' : isNext ? 'var(--accent)' : 'var(--text2)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{date}</div>
                {done && completedEng.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                    By: {completedEng.map(e => e.nickname).join(', ')}
                    {pmStatus[idx]?.completedAt && ` · ${new Date(pmStatus[idx].completedAt).toLocaleDateString()}`}
                  </div>
                )}
              </div>
              {done && <span style={{ fontSize: 20 }}>✅</span>}
              {isNext && !done && (
                <button onClick={() => selectedEngineers.length > 0 && onConfirm(idx)} style={{
                  height: 38, padding: '0 14px', borderRadius: 8, border: 'none', flexShrink: 0,
                  background: selectedEngineers.length > 0 ? 'var(--green)' : 'var(--bg3)',
                  color: selectedEngineers.length > 0 ? '#000' : 'var(--text3)',
                  fontSize: 13, fontWeight: 600,
                  cursor: selectedEngineers.length > 0 ? 'pointer' : 'not-allowed',
                  WebkitTapHighlightColor: 'transparent'
                }}>Mark Done</button>
              )}
            </div>
          )
        })}
      </div>
      {nextIdx >= 0 && selectedEngineers.length === 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--yellow)', padding: '10px 14px', background: 'var(--yellow-dim)', borderRadius: 8, border: '1px solid rgba(255,209,102,0.15)' }}>
          ⚠ Select at least one engineer above to mark PM complete.
        </div>
      )}
    </div>
  )
})

// ── Main component ──
export default function CompletePM() {
  const [device, setDevice] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [justCompleted, setJustCompleted] = useState(null)
  const [selectedEngineers, setSelectedEngineers] = useState([])
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const html5QrRef = useRef(null)
  const dbRef = useRef([])

  useEffect(() => {
    Promise.all([loadDB(), loadAllPMStatus()]).then(([devices]) => {
      dbRef.current = devices
    })
  }, [])

  const search = useCallback((val) => {
    const q = val.trim()
    if (!q) return
    const found = dbRef.current.find(r =>
      r.serial_number?.toLowerCase() === q.toLowerCase() ||
      r.qr_code?.toLowerCase() === q.toLowerCase()
    )
    if (found) { setDevice(found); setNotFound(false) }
    else { setDevice(null); setNotFound(true) }
  }, [])

  const handleQR = useCallback((text) => {
    const code = text.split('/').pop().trim()
    stopScanner()
    search(code)
  }, [search])

  const startScanner = async () => {
    setScanning(true)
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        html5QrRef.current = new Html5Qrcode('qr-reader')
        await html5QrRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, handleQR, () => {})
      } catch { setScanning(false) }
    }, 100)
  }

  const stopScanner = async () => {
    if (html5QrRef.current) { try { await html5QrRef.current.stop() } catch {} html5QrRef.current = null }
    setScanning(false)
  }

  const handleToggleScan = useCallback(() => {
    scanning ? stopScanner() : startScanner()
  }, [scanning])

  useEffect(() => () => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}) }, [])

  const toggleEngineer = useCallback((id) => {
    setSelectedEngineers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  const doComplete = async () => {
    if (confirming === null || !device) return
    setSaving(true)
    try {
      await completePM(device.serial_number, confirming, ENGINEERS.filter(e => selectedEngineers.includes(e.id)))
      setJustCompleted(confirming); setConfirming(null); setRefresh(n => n + 1)
      setTimeout(() => setJustCompleted(null), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally { setSaving(false) }
  }

  const reset = useCallback(() => {
    setDevice(null); setNotFound(false); setJustCompleted(null); setSelectedEngineers([])
  }, [])

  const pageHeader = (
    <div style={{ marginBottom: 20 }}>
      <span className="tag-mono badge-yellow" style={{ marginBottom: 8, display: 'inline-block' }}>03 · Complete PM Job</span>
      <h1 className="page-title">Complete PM Job</h1>
      <p className="page-sub">Scan QR or enter serial number, select engineers, mark PM done.</p>
    </div>
  )

  const deviceHeader = device && (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{device.cs_code}</span>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{device.clinic}</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{device.province} · {device.model}</p>
        </div>
        <button className="btn btn-sm" onClick={reset}>← Back</button>
      </div>
      <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['Serial', device.serial_number], ['Start', device.start]].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{l}</div>
            <div style={{ fontSize: 11, fontFamily: l === 'Serial' ? 'var(--mono)' : 'var(--font)', color: 'var(--text)', wordBreak: 'break-all' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const confirmModal = confirming !== null && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg1)', borderRadius: '20px 20px 0 0', padding: '24px 24px 36px', width: '100%', maxWidth: 480, textAlign: 'center' }} className="slide-up">
        <div style={{ width: 40, height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 44, marginBottom: 10 }}>🔧</div>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>Confirm PM Complete</h3>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 4 }}>{PM_LABELS[confirming]}</p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>{device?.serial_number}</p>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>ENGINEERS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {ENGINEERS.filter(e => selectedEngineers.includes(e.id)).map(e => (
              <span key={e.id} className="badge-green" style={{ padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>{e.nickname}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ flex: 1, height: 50 }} onClick={() => setConfirming(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-green" style={{ flex: 2, height: 50, fontSize: 15 }} onClick={doComplete} disabled={saving}>
            {saving ? '⏳ Saving…' : 'Confirm ✓'}
          </button>
        </div>
      </div>
    </div>
  )

  const toast = justCompleted !== null && (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#000', padding: '12px 24px', borderRadius: 30, fontWeight: 600, fontSize: 14, zIndex: 300, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,229,160,0.3)' }}>
      ✓ {PM_LABELS[justCompleted]} complete!
    </div>
  )

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="desktop-only desktop-page-md">
        {pageHeader}
        {!device && (
          <div style={{ maxWidth: 500 }}>
            <SearchPanel onSearch={search} notFound={notFound} scanning={scanning} onToggleScan={handleToggleScan} />
          </div>
        )}
        {device && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' }} className="slide-up">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{device.cs_code}</span>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{device.clinic}</h2>
                  </div>
                  <button className="btn btn-sm" onClick={reset}>← Back</button>
                </div>
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['Serial', device.serial_number], ['Model', device.model], ['Province', device.province], ['Start', device.start], ['End', device.end], ['Location', device.detail]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: l === 'Serial' ? 'var(--mono)' : 'var(--font)', wordBreak: 'break-all' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {device.map_url && (
                  <div style={{ padding: '0 20px 14px' }}>
                    <a href={device.map_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'none' }}>📍 Google Maps →</a>
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <EngineerPicker selected={selectedEngineers} onToggle={toggleEngineer} />
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <PMRounds device={device} selectedEngineers={selectedEngineers} onConfirm={setConfirming} refresh={refresh} />
            </div>
          </div>
        )}
        {confirmModal}{toast}
      </div>

      {/* ── MOBILE ── */}
      <div className="mobile-only mobile-page">
        {pageHeader}
        {!device && <SearchPanel onSearch={search} notFound={notFound} scanning={scanning} onToggleScan={handleToggleScan} />}
        {device && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="slide-up">
            {deviceHeader}
            <div className="card" style={{ padding: '14px 16px' }}>
              <EngineerPicker selected={selectedEngineers} onToggle={toggleEngineer} />
            </div>
            <div className="card" style={{ padding: '14px 16px' }}>
              <PMRounds device={device} selectedEngineers={selectedEngineers} onConfirm={setConfirming} refresh={refresh} />
            </div>
            {device.map_url && (
              <a href={device.map_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 13, textDecoration: 'none', padding: '4px 0' }}>
                📍 View on Google Maps →
              </a>
            )}
          </div>
        )}
        {confirmModal}{toast}
      </div>
    </>
  )
}
