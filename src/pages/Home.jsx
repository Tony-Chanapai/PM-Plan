import { useState, useEffect } from 'react'
import { getDeviceCount } from '../utils/supabase.js'

const TASKS = [
  { id: 'update', num: '01', title: 'Update Database', desc: 'Upload Excel to build or update the device database. Duplicates skipped by serial number.', icon: '⬆', color: 'var(--accent)', dim: 'var(--accent-dim)' },
  { id: 'planning', num: '02', title: 'Planning', desc: 'Plan day-by-day clinic visits by region. Select clinics, set visit order, export PDF.', icon: '🗺', color: 'var(--green)', dim: 'var(--green-dim)' },
  { id: 'complete', num: '03', title: 'Complete PM Job', desc: 'Scan QR or enter serial number. Select engineers and mark PM rounds as complete.', icon: '✓', color: 'var(--yellow)', dim: 'var(--yellow-dim)' },
]

export default function Home({ onNav, user, onLogout }) {
  const [count, setCount] = useState(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    getDeviceCount().then(setCount).catch(() => setCount(0))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 90px' }}>

      {/* ── DESKTOP ── */}
      <div className="desktop-only" style={{ width: '100%', maxWidth: 860, textAlign: 'center' }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase' }}>Wontech Asia</div>
          <h1 style={{ fontSize: 54, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>PM<span style={{ color: 'var(--accent)' }}>·</span>Plan</h1>
          <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text2)' }}>Preventive Maintenance Management</p>
          {count !== null && count > 0 && (
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 20, padding: '4px 16px', fontSize: 12, color: 'var(--accent)' }}>
              <span style={{ fontFamily: 'var(--mono)' }}>{count}</span> devices in database
            </div>
          )}
          {count === null && <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)' }}>Connecting to database…</div>}
          {user && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>Welcome, <span style={{ color: 'var(--text2)' }}>{user.username}</span>{isAdmin && <span className="badge-yellow" style={{ marginLeft: 8, fontSize: 10 }}>admin</span>}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {TASKS.filter(t => t.id !== 'update' || isAdmin).map(t => (
            <button key={t.id} onClick={() => onNav(t.id)} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 22px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg1)'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: t.color, background: t.dim, padding: '3px 8px', borderRadius: 4 }}>{t.num}</span>
                <span style={{ fontSize: 24 }}>{t.icon}</span>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{t.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{t.desc}</p>
              </div>
              <span style={{ fontSize: 12, color: t.color }}>Open →</span>
            </button>
          ))}
        </div>
        {isAdmin && <div style={{ textAlign: 'center', marginTop: 28 }}><button onClick={() => onNav('settings')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 18px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>⚙ Settings</button></div>}
      </div>

      {/* ── MOBILE ── */}
      <div className="mobile-only" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingTop: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Wontech Asia</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>PM<span style={{ color: 'var(--accent)' }}>·</span>Plan</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{user?.username}</div>
            {isAdmin && <span className="badge-yellow" style={{ fontSize: 9, display: 'inline-block', marginTop: 2 }}>admin</span>}
            <div><button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text3)', cursor: 'pointer', padding: 0, marginTop: 2 }}>Sign out</button></div>
          </div>
        </div>

        {count === null && <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="spin" /> Connecting to database…</div>}
        {count !== null && count > 0 && (
          <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💾</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{count} devices</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Supabase · Live database</div>
            </div>
          </div>
        )}
        {count === 0 && (
          <div style={{ background: 'var(--yellow-dim)', border: '1px solid rgba(255,209,102,0.15)', borderRadius: 12, padding: '10px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--yellow)' }}>⚠ No devices yet — import Excel first</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TASKS.filter(t => t.id !== 'update' || isAdmin).map(t => (
            <button key={t.id} onClick={() => onNav(t.id)}
              style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, width: '100%', WebkitTapHighlightColor: 'transparent' }}
              onTouchStart={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = t.color }}
              onTouchEnd={e => { e.currentTarget.style.background = 'var(--bg1)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: t.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
              <span style={{ color: t.color, fontSize: 20, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
