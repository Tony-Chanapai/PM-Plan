import { useState } from 'react'
import { isLoggedIn, logout, getCurrentUser, isAdmin } from './utils/auth.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import UpdateDB from './pages/UpdateDB.jsx'
import Planning from './pages/Planning.jsx'
import CompletePM from './pages/CompletePM.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'update', icon: '⬆', label: 'Import' },
  { id: 'planning', icon: '🗺', label: 'Plan' },
  { id: 'complete', icon: '✓', label: 'PM Job' },
]

const PAGE_TITLES = { home: 'PM·Plan', update: 'Update Database', planning: 'Planning', complete: 'Complete PM', settings: 'Settings' }

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn())
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(getCurrentUser())
  const admin = user?.role === 'admin'

  if (!authed) return <Login onLogin={() => { setAuthed(true); setUser(getCurrentUser()) }} />

  const doLogout = () => { logout(); setAuthed(false) }

  const PageContent = () => (
    <>
      {page === 'home' && <Home onNav={setPage} user={user} onLogout={doLogout} />}
      {page === 'update' && admin && <UpdateDB />}
      {page === 'update' && !admin && <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>⛔ Admin access required.</div>}
      {page === 'planning' && <Planning />}
      {page === 'complete' && <CompletePM />}
      {page === 'settings' && admin && <Settings />}
    </>
  )

  return (
    <>
      {/* ── DESKTOP SHELL ── */}
      <div className="desktop-shell">
        <header className="desktop-topnav" style={{ gap: 0 }}>
          <button onClick={() => setPage('home')} style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 20, padding: '0 8px' }}>PM·PLAN</button>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {NAV.slice(1).filter(n => n.id !== 'update' || admin).map(n => (
              <button key={n.id} className={`desktop-navbtn${page===n.id?' active':''}`} onClick={() => setPage(n.id)}>{n.label}</button>
            ))}
            {admin && <button className={`desktop-navbtn${page==='settings'?' active':''}`} onClick={() => setPage('settings')}>⚙ Settings</button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.name || user?.username}</span>
            {admin && <span className="badge-yellow" style={{ fontSize: 10 }}>admin</span>}
            <button onClick={doLogout} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>Sign out</button>
          </div>
        </header>
        <main style={{ flex: 1 }}>
          <PageContent />
        </main>
      </div>

      {/* ── MOBILE SHELL ── */}
      <div className="mobile-shell">
        {page !== 'home' && (
          <header className="mobile-topbar">
            <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, lineHeight: 1, padding: '4px 8px 4px 0', cursor: 'pointer' }}>←</button>
            <span style={{ fontWeight: 600, fontSize: 16, flex: 1 }}>{PAGE_TITLES[page]}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 8 }}>{user?.username}</span>
            <button onClick={doLogout} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>Out</button>
          </header>
        )}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <PageContent />
        </main>
        <nav className="mobile-bottomnav">
          {NAV.filter(n => n.id !== 'update' || admin).map(n => (
            <button key={n.id} className={`mobile-navitem${page===n.id?' active':''}`} onClick={() => setPage(n.id)}>
              <span className="navicon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
          {admin && (
            <button className={`mobile-navitem${page==='settings'?' active':''}`} onClick={() => setPage('settings')}>
              <span className="navicon">⚙</span>
              <span>Settings</span>
            </button>
          )}
        </nav>
      </div>
    </>
  )
}
