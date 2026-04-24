import { useState } from 'react'
import { isLoggedIn, logout } from './utils/auth.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import UpdateDB from './pages/UpdateDB.jsx'
import Planning from './pages/Planning.jsx'
import CompletePM from './pages/CompletePM.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn())
  const [page, setPage] = useState('home')
  const nav = (p) => setPage(p)

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {page !== 'home' && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 24px', background: 'var(--bg1)',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100
        }}>
          <button onClick={() => nav('home')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, padding: '4px 0', cursor: 'pointer' }}>← Back</button>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>PM-PLAN</span>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>
            {page === 'update' && '/ Update Database'}
            {page === 'planning' && '/ Planning'}
            {page === 'complete' && '/ Complete PM Job'}
          </span>
          <button onClick={() => { logout(); setAuthed(false) }} style={{
            marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text3)', cursor: 'pointer'
          }}>Sign out</button>
        </header>
      )}
      {page === 'home' && (
        <div style={{ position: 'absolute', top: 16, right: 24 }}>
          <button onClick={() => { logout(); setAuthed(false) }} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '4px 12px', fontSize: 11, color: 'var(--text3)', cursor: 'pointer'
          }}>Sign out</button>
        </div>
      )}
      <main style={{ flex: 1 }}>
        {page === 'home' && <Home onNav={nav} />}
        {page === 'update' && <UpdateDB />}
        {page === 'planning' && <Planning />}
        {page === 'complete' && <CompletePM />}
      </main>
    </div>
  )
}
