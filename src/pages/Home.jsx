import { loadDB } from '../utils/db.js'

const tasks = [
  {
    id: 'update',
    num: '01',
    title: 'Update Database',
    desc: 'Upload Excel file to create or update the device database. New serial numbers are added; duplicates are skipped.',
    icon: '⬆',
    color: 'var(--accent)',
    colorDim: 'var(--accent-dim)',
  },
  {
    id: 'planning',
    num: '02',
    title: 'Planning',
    desc: 'Browse devices by region and Bangkok area. Select clinics and export a PM visit plan as PDF.',
    icon: '🗺',
    color: 'var(--green)',
    colorDim: 'var(--green-dim)',
  },
  {
    id: 'complete',
    num: '03',
    title: 'Complete PM Job',
    desc: 'Scan QR code or enter serial number to log a completed PM round. Updates the device record immediately.',
    icon: '✓',
    color: 'var(--yellow)',
    colorDim: 'var(--yellow-dim)',
  },
]

export default function Home({ onNav }) {
  const db = loadDB()
  const total = db.length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase' }}>
          Wontech Asia
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
          PM<span style={{ color: 'var(--accent)' }}>·</span>Plan
        </h1>
        <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text2)' }}>
          Preventive Maintenance Management
        </p>
        {total > 0 && (
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'var(--accent)' }}>
            <span style={{ fontFamily: 'var(--mono)' }}>{total}</span> devices in database
          </div>
        )}
      </div>

      {/* Task Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, width: '100%', maxWidth: 860 }}>
        {tasks.map(t => (
          <button
            key={t.id}
            onClick={() => onNav(t.id)}
            style={{
              background: 'var(--bg1)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '28px 24px', textAlign: 'left',
              transition: 'all 0.2s', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = t.color
              e.currentTarget.style.background = 'var(--bg2)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--bg1)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: t.color,
                background: t.colorDim, padding: '3px 8px', borderRadius: 4,
                letterSpacing: '0.1em'
              }}>
                {t.num}
              </span>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{t.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{t.desc}</p>
            </div>
            <div style={{ fontSize: 12, color: t.color, display: 'flex', alignItems: 'center', gap: 4 }}>
              Open <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
