import { useState } from 'react'
import { login } from '../utils/auth.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (login(username, password)) {
        onLogin()
      } else {
        setError('Incorrect username or password.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,229,160,0.03) 0%, transparent 50%)'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>
            Wontech Asia
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
            PM<span style={{ color: 'var(--accent)' }}>·</span>Plan
          </h1>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>Preventive Maintenance Management</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 24 }}>Enter your credentials to access PM-Plan</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Enter username"
                autoFocus
                style={{
                  width: '100%', height: 42, padding: '0 14px',
                  background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
                  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  style={{
                    width: '100%', height: 42, padding: '0 42px 0 14px',
                    background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
                    borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: 2
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                height: 44, background: loading ? 'var(--bg3)' : 'var(--accent)',
                color: loading ? 'var(--text2)' : '#000', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, transition: 'all 0.15s', opacity: (!username || !password) ? 0.5 : 1
              }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          Wontech Asia · Internal Tool
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
