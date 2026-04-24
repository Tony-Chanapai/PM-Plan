import { useState, useRef, useCallback } from 'react'
import { parseExcel } from '../utils/excel.js'
import { upsertDevices, getDeviceCount } from '../utils/supabase.js'

const COLS = ['No.','CS-Code','Model','Serial Number','Service Type','Start','End','Clinic','Province']

function ResultCards({ result, onReset }) {
  return (
    <div className="card slide-up" style={{ padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>Database Updated!</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['Imported', result.imported, 'var(--green)'], ['Skipped', result.duplicates, 'var(--yellow)'], ['Total', result.total, 'var(--text)']].map(([l,v,c]) => (
          <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', minWidth: 80 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={onReset}>Upload Another File</button>
    </div>
  )
}

export default function UpdateDB() {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const processFile = useCallback((file) => {
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) { setError('Please upload an Excel file (.xlsx or .xls)'); return }
    setLoading(true); setError(''); setResult(null); setPreview(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try { setPreview({ fileName: file.name, rows: parseExcel(e.target.result) }) }
      catch (err) { setError('Could not read file: ' + err.message) }
      finally { setLoading(false) }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const buildDB = async () => {
    if (!preview) return
    setUploading(true)
    setError('')
    try {
      const validRows = preview.rows.filter(r => r.serial_number)

      // Upload in batches of 200 to avoid request size limits
      const batchSize = 200
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize)
        await upsertDevices(batch)
      }

      // Get updated count
      const newCount = await getDeviceCount()
      setResult({
        imported: validRows.length,
        duplicates: preview.rows.length - validRows.length,
        total: newCount
      })
    } catch (err) {
      setError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const DropZone = () => (
    <div
      style={{ border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 16, padding: '52px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--accent-dim)' : 'var(--bg1)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }}
      onClick={() => fileRef.current?.click()}
    >
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
      {loading ? <div style={{ width: 40, height: 40, border: '3px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="spin" /> : <div style={{ fontSize: 52 }}>📂</div>}
      <p style={{ color: 'var(--text2)', fontSize: 15, fontWeight: 500 }}>{loading ? 'Reading file…' : 'Tap to select Excel file'}</p>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>.xlsx · .xls</p>
    </div>
  )

  const Header = () => (
    <div style={{ marginBottom: 24 }}>
      <span className="tag-mono badge-accent" style={{ marginBottom: 10, display: 'inline-block' }}>01 · Import</span>
      <h1 className="page-title">Upload Excel</h1>
      <p className="page-sub">Upload PM spreadsheet — new serial numbers added to Supabase, duplicates skipped.</p>
    </div>
  )

  const ErrorBar = () => error ? (
    <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ flex: 1 }}>⚠ {error}</span>
      <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
    </div>
  ) : null

  // ── DESKTOP ──
  const Desktop = () => (
    <div className="desktop-only desktop-page" style={{ maxWidth: 900 }}>
      <Header />
      {!preview && !result && <><DropZone /><ErrorBar /></>}
      {preview && !result && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {[['Rows', preview.rows.length], ['Models', new Set(preview.rows.map(r=>r.model)).size], ['Provinces', new Set(preview.rows.map(r=>r.province)).size]].map(([l,v]) => (
              <div key={l} className="card" style={{ padding: '10px 18px' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setPreview(null)}>Change file</button>
              <button className="btn btn-primary btn-sm" onClick={buildDB} disabled={uploading}>
                {uploading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }} className="spin" /> Uploading…</> : 'Upload to Supabase →'}
              </button>
            </div>
          </div>
          <ErrorBar />
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="tbl-wrap" style={{ maxHeight: '58vh' }}>
              <table>
                <thead><tr>{COLS.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td>{r.no}</td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{r.cs_code}</span></td>
                      <td>{r.model}</td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.serial_number}</span></td>
                      <td><span className="badge-green">{r.service_type}</span></td>
                      <td style={{ fontSize: 11 }}>{r.start}</td>
                      <td style={{ fontSize: 11 }}>{r.end}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.clinic}</td>
                      <td>{r.province}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 50 && <div style={{ textAlign: 'center', padding: 10, color: 'var(--text3)', fontSize: 12 }}>+{preview.rows.length - 50} more rows</div>}
          </div>
        </>
      )}
      {result && <ResultCards result={result} onReset={() => { setPreview(null); setResult(null) }} />}
    </div>
  )

  // ── MOBILE ──
  const Mobile = () => (
    <div className="mobile-only mobile-page">
      <Header />
      {!preview && !result && <><DropZone /><div style={{ marginTop: 12 }}><ErrorBar /></div></>}
      {preview && !result && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Rows', preview.rows.length], ['Models', new Set(preview.rows.map(r=>r.model)).size]].map(([l,v]) => (
                <div key={l} className="card" style={{ padding: '8px 14px' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setPreview(null)}>Change</button>
              <button className="btn btn-primary btn-sm" onClick={buildDB} disabled={uploading}>
                {uploading ? '⏳ Uploading…' : 'Upload →'}
              </button>
            </div>
          </div>
          <ErrorBar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preview.rows.slice(0, 30).map((r, i) => (
              <div key={i} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{r.cs_code}</span>
                  <span className="badge-green" style={{ fontSize: 10 }}>{r.service_type}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{r.clinic}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{r.serial_number}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.province} · {r.model} · {r.start}</div>
              </div>
            ))}
            {preview.rows.length > 30 && <div style={{ textAlign: 'center', padding: 10, color: 'var(--text3)', fontSize: 12 }}>+{preview.rows.length - 30} more</div>}
          </div>
        </>
      )}
      {result && <ResultCards result={result} onReset={() => { setPreview(null); setResult(null) }} />}
    </div>
  )

  return <><Desktop /><Mobile /></>
}
