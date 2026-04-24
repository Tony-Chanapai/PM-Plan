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
    setLoading(true); setError('')
    setTimeout(() => {
      if (login(username, password)) { onLogin() }
      else { setError('Incorrect username or password.'); setLoading(false) }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px 16px',
      backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(0,212,255,0.05) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>Wontech Asia</div>
          <h1 style={{ fontSize: 'clamp(38px, 12vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
            PM<span style={{ color: 'var(--accent)' }}>·</span>Plan
          </h1>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>Preventive Maintenance Management</p>
        </div>

        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px 20px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 24 }}>Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Username</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Enter username" autoFocus autoCapitalize="none" autoCorrect="off"
                style={{ width: '100%', height: 50, padding: '0 14px', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`, borderRadius: 12, color: 'var(--text)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  style={{ width: '100%', height: 50, padding: '0 50px 0 14px', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`, borderRadius: 12, color: 'var(--text)', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>⚠ {error}</div>
            )}

            <button type="submit" disabled={loading || !username || !password} style={{
              height: 52, background: loading || !username || !password ? 'var(--bg3)' : 'var(--accent)',
              color: loading || !username || !password ? 'var(--text2)' : '#000',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4
            }}>
              {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} className="spin" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>Wontech Asia · Internal Tool</p>
      </div>
    </div>
  )
}
