import { useState, useRef, useCallback } from 'react'
import { parseExcel, PM_ROUND_LABELS } from '../utils/excel.js'
import { loadDB, saveDB } from '../utils/db.js'

export default function UpdateDB() {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const processFile = useCallback((file) => {
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    setLoading(true); setError(''); setResult(null); setPreview(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rows = parseExcel(e.target.result)
        setPreview({ fileName: file.name, rows })
      } catch (err) {
        setError('Could not read file: ' + err.message)
      } finally { setLoading(false) }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const buildDB = () => {
    if (!preview) return
    const existing = loadDB()
    const existingSerials = new Set(existing.map(r => r.serial_number))
    const newRows = preview.rows.filter(r => r.serial_number && !existingSerials.has(r.serial_number))
    const updated = [...existing, ...newRows]
    saveDB(updated)
    setResult({ imported: newRows.length, duplicates: preview.rows.length - newRows.length, total: updated.length })
  }

  const S = styles

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.breadcrumb}><span style={S.tag}>01</span> Update Database</div>
        <h1 style={S.title}>Upload Excel</h1>
        <p style={S.sub}>Upload your PM spreadsheet. New records are added by serial number — duplicates are skipped.</p>
      </div>

      {/* Drop Zone */}
      {!preview && (
        <div
          style={{ ...S.dropZone, ...(dragging ? S.dragging : {}) }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
          {loading
            ? <div style={S.spinner} />
            : <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
          }
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Drop your Excel file here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span></p>
          <p style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>.xlsx · .xls</p>
        </div>
      )}

      {error && (
        <div style={S.errorBar}>⚠ {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--red)', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <>
          <div style={S.metaRow}>
            {[['Rows', preview.rows.length], ['Models', new Set(preview.rows.map(r=>r.model)).size], ['Provinces', new Set(preview.rows.map(r=>r.province)).size]].map(([l,v]) => (
              <div key={l} style={S.metaCard}>
                <span style={{ fontSize: 26, fontWeight: 600 }}>{v}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn" onClick={() => setPreview(null)}>Change file</button>
              <button className="btn btn-primary" onClick={buildDB}>Build Database →</button>
            </div>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['No.','CS-Code','Model','Serial Number','Service Type','Start','End','Clinic','Location','Province','PM Rounds'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 20).map((r, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: 'rgba(255,255,255,0.01)' }}>
                    <td style={S.td}>{r.no}</td>
                    <td style={S.td}><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{r.cs_code}</span></td>
                    <td style={S.td}>{r.model}</td>
                    <td style={S.td}><span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.serial_number}</span></td>
                    <td style={S.td}><span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '1px 7px', borderRadius: 4, fontSize: 11 }}>{r.service_type}</span></td>
                    <td style={S.td}>{r.start}</td>
                    <td style={S.td}>{r.end}</td>
                    <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clinic}</td>
                    <td style={S.td}>{r.location}</td>
                    <td style={S.td}>{r.province}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {PM_ROUND_LABELS.map((lb, idx) => (
                          <span key={idx} style={{ background: r.pm_dates[idx] ? 'var(--accent-dim)' : 'var(--bg3)', color: r.pm_dates[idx] ? 'var(--accent)' : 'var(--text3)', fontSize: 10, padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--mono)' }}>{lb}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 20 && <div style={{ textAlign: 'center', padding: 12, color: 'var(--text3)', fontSize: 12 }}>+ {preview.rows.length - 20} more rows</div>}
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>Database Updated!</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
            <div style={S.metaCard}><span style={{ fontSize: 28, color: 'var(--green)' }}>{result.imported}</span><span style={{ fontSize: 11, color: 'var(--text2)' }}>IMPORTED</span></div>
            <div style={S.metaCard}><span style={{ fontSize: 28, color: 'var(--yellow)' }}>{result.duplicates}</span><span style={{ fontSize: 11, color: 'var(--text2)' }}>SKIPPED</span></div>
            <div style={S.metaCard}><span style={{ fontSize: 28 }}>{result.total}</span><span style={{ fontSize: 11, color: 'var(--text2)' }}>TOTAL IN DB</span></div>
          </div>
          <button className="btn btn-primary" onClick={() => { setPreview(null); setResult(null) }}>Upload Another File</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 28 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: 'var(--text3)' },
  tag: { background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text2)' },
  dropZone: {
    border: '1px dashed var(--border2)', borderRadius: 16, padding: '60px 24px',
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    background: 'var(--bg1)', marginBottom: 20
  },
  dragging: { borderColor: 'var(--accent)', background: 'var(--accent-dim)' },
  errorBar: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 },
  metaRow: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  metaCard: { background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 },
  tableWrap: { background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto', maxHeight: '60vh' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
  td: { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', whiteSpace: 'nowrap' },
  card: { background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16 },
  spinner: { width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
