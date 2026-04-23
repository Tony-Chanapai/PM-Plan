import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import {
  Link2, Upload, FileSpreadsheet, Database,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, X, Table2
} from 'lucide-react'
import styles from './ImportPage.module.css'

const DB_OPTIONS = ['SQLite (local)', 'PostgreSQL', 'MySQL', 'Supabase', 'Firebase']

const STATUS_COLORS = {
  Done: { bg: 'rgba(52,211,153,0.1)', color: '#34d399' },
  'In Progress': { bg: 'rgba(79,156,249,0.1)', color: '#4f9cf9' },
  'Not Started': { bg: 'rgba(142,150,170,0.1)', color: '#8892a4' },
  Blocked: { bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
}

function StatusBadge({ value }) {
  const s = STATUS_COLORS[value] || STATUS_COLORS['Not Started']
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 5, fontSize: 12, whiteSpace: 'nowrap' }}>
      {value || '—'}
    </span>
  )
}

function parseDriveUrl(url) {
  const match = url.match(/[-\w]{25,}/)
  return match ? match[0] : null
}

export default function ImportPage() {
  const [driveUrl, setDriveUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [dbType, setDbType] = useState(DB_OPTIONS[0])
  const [tableName, setTableName] = useState('pm_tasks')
  const [buildStatus, setBuildStatus] = useState('')
  const fileRef = useRef()

  const processWorkbook = useCallback((workbook, fileName) => {
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    const cols = rows.length > 0 ? Object.keys(rows[0]) : []
    setData({
      fileName,
      sheetNames: workbook.SheetNames,
      activeSheet: sheetName,
      rows,
      cols,
    })
    setError('')
    setBuildStatus('')
  }, [])

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file.')
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        processWorkbook(wb, file.name)
      } catch {
        setError('Could not parse file. Make sure it is a valid Excel or CSV file.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [processWorkbook])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const fetchFromDrive = async () => {
    const fileId = parseDriveUrl(driveUrl)
    if (!fileId) { setError('Could not extract a file ID from the link. Make sure sharing is set to "Anyone with the link".'); return }
    setLoading(true)
    setError('')
    try {
      const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      const res = await fetch(exportUrl)
      if (!res.ok) throw new Error('Could not fetch file. Ensure sharing is set to public.')
      const buf = await res.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      processWorkbook(wb, `drive_file_${fileId.slice(0, 8)}.xlsx`)
    } catch (err) {
      setError(err.message || 'Failed to fetch from Google Drive.')
    } finally {
      setLoading(false)
    }
  }

  const buildDatabase = () => {
    setBuildStatus('loading')
    setTimeout(() => setBuildStatus('done'), 1800)
  }

  const previewRows = data ? data.rows.slice(0, 8) : []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <span className={styles.partTag}>Part 01</span>
          <ChevronRight size={13} color="var(--text-muted)" />
          <span>Import Data</span>
        </div>
        <h1 className={styles.title}>Build database from Excel</h1>
        <p className={styles.subtitle}>
          Connect a Google Drive spreadsheet or upload a local file to auto-generate your project database.
        </p>
      </div>

      <section className={styles.section}>
        <div className={styles.stepLabel}><span className={styles.stepNum}>1</span> Choose data source</div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <Link2 size={15} strokeWidth={1.8} />
            <span>Google Drive link</span>
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.textInput}
              type="text"
              placeholder="https://drive.google.com/file/d/…"
              value={driveUrl}
              onChange={e => { setDriveUrl(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && fetchFromDrive()}
            />
            <button className={styles.btnPrimary} onClick={fetchFromDrive} disabled={!driveUrl.trim() || loading}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : 'Fetch'}
            </button>
          </div>
          <p className={styles.hint}>Set sharing to "Anyone with the link can view" before pasting.</p>
        </div>

        <div className={styles.orDivider}><span>or</span></div>

        <div
          className={[styles.dropZone, dragging ? styles.dragging : ''].join(' ')}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <Upload size={24} strokeWidth={1.4} color="var(--text-muted)" />
          <p className={styles.dropMain}>Drop your file here or <span className={styles.link}>browse</span></p>
          <p className={styles.dropSub}>.xlsx · .xls · .csv</p>
        </div>

        {error && (
          <div className={styles.errorBar}>
            <AlertCircle size={14} />
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={12} /></button>
          </div>
        )}
      </section>

      {data && (
        <section className={styles.section}>
          <div className={styles.stepLabel}><span className={styles.stepNum}>2</span> Review detected data</div>
          <div className={styles.metaRow}>
            <div className={styles.metaCard}>
              <span className={styles.metaNum}>{data.rows.length}</span>
              <span className={styles.metaLabel}>rows</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaNum}>{data.cols.length}</span>
              <span className={styles.metaLabel}>columns</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaNum}>{data.sheetNames.length}</span>
              <span className={styles.metaLabel}>sheets</span>
            </div>
            <div className={styles.metaFile}>
              <FileSpreadsheet size={13} strokeWidth={1.8} color="var(--accent)" />
              <span>{data.fileName}</span>
            </div>
          </div>
          <div className={styles.colChips}>
            {data.cols.map(c => (
              <span key={c} className={styles.chip}>{c}</span>
            ))}
          </div>
          <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.tableHeader}>
              <Table2 size={14} strokeWidth={1.8} />
              <span>Preview — first {previewRows.length} rows</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>{data.cols.map(c => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {data.cols.map(c => (
                        <td key={c}>
                          {c.toLowerCase().includes('status') ? (
                            <StatusBadge value={String(row[c])} />
                          ) : (
                            <span>{String(row[c]) || '—'}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {data && (
        <section className={styles.section}>
          <div className={styles.stepLabel}><span className={styles.stepNum}>3</span> Configure database</div>
          <div className={styles.card}>
            <div className={styles.dbRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Database type</label>
                <select className={styles.select} value={dbType} onChange={e => setDbType(e.target.value)}>
                  {DB_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup} style={{ flex: 2 }}>
                <label className={styles.fieldLabel}>Table name</label>
                <input className={styles.textInput} value={tableName}
                  onChange={e => setTableName(e.target.value)} placeholder="pm_tasks" />
              </div>
            </div>
            <div className={styles.dbActions}>
              <div className={styles.statusLine}>
                {buildStatus === '' && (
                  <><span className={styles.dotIdle} /> <span>Ready — {data.rows.length} records will be imported into <code>{tableName}</code></span></>
                )}
                {buildStatus === 'loading' && (
                  <><Loader2 size={13} className={styles.spin} color="var(--accent)" /> <span>Building database…</span></>
                )}
                {buildStatus === 'done' && (
                  <><CheckCircle2 size={13} color="var(--success)" /> <span style={{ color: 'var(--success)' }}>Database built — {data.rows.length} rows imported into <code>{tableName}</code></span></>
                )}
              </div>
              <button
                className={styles.btnBuild}
                onClick={buildDatabase}
                disabled={buildStatus === 'loading' || buildStatus === 'done'}
              >
                <Database size={14} strokeWidth={1.8} />
                {buildStatus === 'done' ? 'Done' : 'Build database'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}