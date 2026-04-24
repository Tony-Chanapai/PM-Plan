import { useState, useEffect, useRef } from 'react'
import { loadDB, getPMStatus, completePM, getNextPMIndex } from '../utils/db.js'
import { ENGINEERS } from '../utils/engineers.js'

const PM_LABELS = ['3 Month','6 Month','9 Month','12 Month','15 Month','18 Month','21 Month','24 Month (Final)']

export default function CompletePM() {
  const [input, setInput] = useState('')
  const [device, setDevice] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [justCompleted, setJustCompleted] = useState(null)
  const [selectedEngineers, setSelectedEngineers] = useState([])
  const [, forceUpdate] = useState(0)
  const html5QrRef = useRef(null)

  const search = (val) => {
    const q = (val || input).trim()
    if (!q) return
    const db = loadDB()
    const found = db.find(r =>
      r.serial_number?.toLowerCase() === q.toLowerCase() ||
      r.qr_code?.toLowerCase() === q.toLowerCase()
    )
    if (found) { setDevice(found); setNotFound(false) }
    else { setDevice(null); setNotFound(true) }
  }

  const handleQR = (decodedText) => {
    const parts = decodedText.split('/')
    const code = parts[parts.length - 1].trim()
    stopScanner()
    setInput(code)
    search(code)
  }

  const startScanner = async () => {
    setScanning(true)
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        html5QrRef.current = new Html5Qrcode('qr-reader')
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleQR, () => {}
        )
      } catch { setScanning(false) }
    }, 100)
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch {}
      html5QrRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => () => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}) }, [])

  const toggleEngineer = (id) => {
    setSelectedEngineers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const pmStatus = device ? getPMStatus(device.serial_number) : {}
  const nextIdx = device ? getNextPMIndex(device.serial_number) : -1
  const donePMs = Object.values(pmStatus).filter(v => v.completed).length

  const doComplete = () => {
    if (confirming === null || !device) return
    const engineers = ENGINEERS.filter(e => selectedEngineers.includes(e.id))
    completePM(device.serial_number, confirming, engineers)
    setJustCompleted(confirming)
    setConfirming(null)
    forceUpdate(n => n + 1)
    setTimeout(() => setJustCompleted(null), 3000)
  }

  const reset = () => { setDevice(null); setInput(''); setNotFound(false); setJustCompleted(null); setSelectedEngineers([]) }

  const S = styles

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.breadcrumb}><span style={S.tag}>03</span> Complete PM Job</div>
        <h1 style={S.title}>Complete PM Job</h1>
        <p style={S.sub}>Scan QR code or enter serial number, select engineers, then mark PM complete.</p>
      </div>

      {!device && (
        <div style={{ maxWidth: 500 }}>
          <div style={S.card}>
            <div style={{ padding: 20 }}>
              <label style={S.label}>SERIAL NUMBER OR QR CODE</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="e.g. B4OLG302-1856"
                  style={S.input}
                />
                <button className="btn btn-primary" onClick={() => search()}>Search</button>
              </div>
              {notFound && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--red)' }}>⚠ Device not found.</p>}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Or use camera:</span>
              <button className="btn" onClick={scanning ? stopScanner : startScanner}>
                {scanning ? '⏹ Stop Scanner' : '📷 Scan QR Code'}
              </button>
            </div>
          </div>
          {scanning && (
            <div style={{ ...S.card, marginTop: 16, padding: 20 }}>
              <div id="qr-reader" style={{ width: '100%' }} />
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginTop: 10 }}>Point camera at QR code</p>
            </div>
          )}
        </div>
      )}

      {device && (
        <div style={{ maxWidth: 680 }}>
          <div style={S.card}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{device.cs_code}</span>
                <h2 style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{device.clinic}</h2>
              </div>
              <button className="btn" onClick={reset} style={{ height: 30, fontSize: 12, padding: '0 12px' }}>← Back</button>
            </div>

            {/* Device Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[
                ['Serial Number', device.serial_number],
                ['Model', device.model],
                ['Service Type', device.service_type],
                ['Province', device.province],
                ['Start Date', device.start],
                ['End Date', device.end],
                ['Location', device.detail],
                ['QR Code', device.qr_code || '—'],
              ].map(([label, val], i) => (
                <div key={i} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: label === 'Serial Number' || label === 'QR Code' ? 'var(--mono)' : 'var(--font)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Engineer Selection */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                Engineers on this job
                {selectedEngineers.length > 0 && (
                  <span style={{ background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 10, padding: '1px 10px', fontSize: 11 }}>
                    {selectedEngineers.length} selected
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ENGINEERS.map(e => {
                  const sel = selectedEngineers.includes(e.id)
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleEngineer(e.id)}
                      style={{
                        padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        fontWeight: sel ? 600 : 400, transition: 'all 0.15s',
                        background: sel ? 'var(--green-dim)' : 'var(--bg2)',
                        border: `1px solid ${sel ? 'rgba(0,229,160,0.3)' : 'var(--border2)'}`,
                        color: sel ? 'var(--green)' : 'var(--text2)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1
                      }}
                    >
                      <span>{e.nickname}</span>
                      <span style={{ fontSize: 9, color: sel ? 'rgba(0,229,160,0.7)' : 'var(--text3)' }}>{e.fullname.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PM Progress */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>PM Progress</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 20 }}>{donePMs}/8</span>
                {donePMs >= 8 && <span style={{ background: 'var(--green-dim)', color: 'var(--green)', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>All Complete ✓</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PM_LABELS.map((label, idx) => {
                  const st = getPMStatus(device.serial_number)
                  const done = st[idx]?.completed
                  const isNext = idx === nextIdx
                  const date = device.pm_dates?.[idx] || ''
                  const completedEngineers = st[idx]?.engineers || []

                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 8, border: '1px solid',
                      borderColor: done ? 'rgba(0,229,160,0.2)' : isNext ? 'rgba(0,212,255,0.3)' : 'var(--border)',
                      background: done ? 'var(--green-dim)' : isNext ? 'var(--accent-dim)' : 'transparent',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'var(--green)' : isNext ? 'var(--accent)' : 'var(--bg3)',
                        color: done || isNext ? '#000' : 'var(--text3)', fontWeight: 700, fontSize: 11
                      }}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: done ? 'var(--green)' : isNext ? 'var(--accent)' : 'var(--text2)', fontWeight: isNext ? 600 : 400 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{date}</div>
                        {done && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                            {st[idx]?.completedAt && `Done: ${new Date(st[idx].completedAt).toLocaleDateString()}`}
                            {completedEngineers.length > 0 && ` · By: ${completedEngineers.map(e => e.nickname).join(', ')}`}
                          </div>
                        )}
                      </div>
                      {isNext && !done && (
                        <button
                          className="btn btn-green"
                          style={{ height: 32, padding: '0 14px', fontSize: 12, opacity: selectedEngineers.length === 0 ? 0.5 : 1 }}
                          onClick={() => selectedEngineers.length > 0 && setConfirming(idx)}
                          title={selectedEngineers.length === 0 ? 'Select at least one engineer first' : ''}
                        >
                          Mark Done
                        </button>
                      )}
                      {done && <span style={{ fontSize: 18 }}>✅</span>}
                    </div>
                  )
                })}
              </div>

              {nextIdx >= 0 && selectedEngineers.length === 0 && (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚠ Select at least one engineer above to mark a PM as complete.
                </p>
              )}

              {device.map_url && (
                <a href={device.map_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: 'var(--accent)', fontSize: 12, textDecoration: 'none' }}>
                  📍 View on Google Maps →
                </a>
              )}
            </div>
          </div>

          {/* Confirm Modal */}
          {confirming !== null && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
              <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 18, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>Confirm PM Completion</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 6 }}><strong>{PM_LABELS[confirming]}</strong></p>
                <p style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12, marginBottom: 12 }}>{device.serial_number}</p>

                <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>ENGINEERS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {ENGINEERS.filter(e => selectedEngineers.includes(e.id)).map(e => (
                      <span key={e.id} style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                        {e.nickname}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn" onClick={() => setConfirming(null)}>Cancel</button>
                  <button className="btn btn-green" onClick={doComplete}>Confirm ✓</button>
                </div>
              </div>
            </div>
          )}

          {justCompleted !== null && (
            <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#000', padding: '12px 24px', borderRadius: 30, fontWeight: 600, fontSize: 14, zIndex: 300, whiteSpace: 'nowrap' }}>
              ✓ {PM_LABELS[justCompleted]} marked complete!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 28 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: 'var(--text3)' },
  tag: { background: 'var(--yellow-dim)', color: 'var(--yellow)', fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text2)' },
  card: { background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  label: { display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  input: { flex: 1, height: 40, padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--mono)' },
}
