import { useState, memo, useCallback } from 'react'
import { getUsers, saveUsers, getCurrentUser } from '../utils/auth.js'

const DEFAULT_ADMIN = 'Tony'

const S = {
  label: { display: 'block', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  input: { width: '100%', height: 40, padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)' },
  select: { width: '100%', height: 40, padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' },
}

// ── Isolated Add User Form — has its own state, no parent re-render on typing ──
const AddUserForm = memo(({ onAdd, onCancel }) => {
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.username.trim() || !form.password.trim()) return
    onAdd({ ...form, username: form.username.trim(), name: form.name.trim() || form.username.trim() })
  }

  return (
    <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--accent-dim)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>New User</div>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div><label style={S.label}>Username *</label><input style={S.input} value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. Jan" autoCapitalize="none" /></div>
        <div><label style={S.label}>Password *</label><input style={S.input} type="text" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Set a password" /></div>
        <div><label style={S.label}>Full Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sathit Intarachot" /></div>
        <div><label style={S.label}>Role</label>
          <select style={S.select} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!form.username.trim() || !form.password.trim()}>Add User</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
})

// ── Isolated Edit Form ──
const EditUserForm = memo(({ user, isMain, onSave, onCancel }) => {
  const [form, setForm] = useState({ ...user })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--yellow-dim)' }}>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div><label style={S.label}>Username</label><input style={S.input} value={form.username} onChange={e => set('username', e.target.value)} disabled={isMain} /></div>
        <div><label style={S.label}>Password</label><input style={S.input} type="text" value={form.password} onChange={e => set('password', e.target.value)} /></div>
        <div><label style={S.label}>Full Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><label style={S.label}>Role</label>
          <select style={S.select} value={form.role} onChange={e => set('role', e.target.value)} disabled={isMain}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Save</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
})

// ── Single user row ──
const UserRow = memo(({ u, idx, isSelf, isMain, isEditing, showPass, onEdit, onDelete, onTogglePass, onSave, onCancelEdit }) => {
  if (isEditing) return <EditUserForm user={u} isMain={isMain} onSave={onSave} onCancel={onCancelEdit} />

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: u.role === 'admin' ? 'var(--accent)' : 'var(--text2)', flexShrink: 0 }}>
        {u.username[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</span>
          {isSelf && <span className="badge-accent" style={{ fontSize: 10 }}>You</span>}
          <span style={{ fontSize: 10, background: u.role === 'admin' ? 'var(--yellow-dim)' : 'var(--bg3)', color: u.role === 'admin' ? 'var(--yellow)' : 'var(--text3)', padding: '1px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{u.role}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.name || '—'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', minWidth: 70 }}>{showPass ? u.password : '••••••••'}</span>
        <button onClick={onTogglePass} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: 2 }}>{showPass ? '🙈' : '👁'}</button>
        <button className="btn btn-sm" onClick={onEdit}>Edit</button>
        {!isMain && !isSelf && <button className="btn btn-sm btn-danger" onClick={onDelete}>Del</button>}
      </div>
    </div>
  )
})

// ── Mobile user card ──
const UserCard = memo(({ u, idx, isSelf, isMain, isEditing, onEdit, onDelete, onSave, onCancelEdit }) => {
  if (isEditing) return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>{u.username}</div>
      <div style={{ padding: 14 }}>
        <EditUserForm user={u} isMain={isMain} onSave={onSave} onCancel={onCancelEdit} />
      </div>
    </div>
  )
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: u.role === 'admin' ? 'var(--accent)' : 'var(--text2)', flexShrink: 0 }}>
          {u.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{u.username}</span>
            {isSelf && <span className="badge-accent" style={{ fontSize: 9 }}>You</span>}
            <span style={{ fontSize: 10, background: u.role === 'admin' ? 'var(--yellow-dim)' : 'var(--bg3)', color: u.role === 'admin' ? 'var(--yellow)' : 'var(--text3)', padding: '1px 6px', borderRadius: 4 }}>{u.role}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.name || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={onEdit}>Edit</button>
          {!isMain && !isSelf && <button className="btn btn-sm btn-danger" onClick={onDelete}>Del</button>}
        </div>
      </div>
    </div>
  )
})

// ── Main Settings component ──
export default function Settings() {
  const [users, setUsers] = useState(getUsers())
  const [showAdd, setShowAdd] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [msg, setMsg] = useState('')
  const [showPassIdx, setShowPassIdx] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const currentUser = getCurrentUser()

  const flash = useCallback((text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }, [])

  const handleAdd = useCallback((newUser) => {
    if (users.find(u => u.username === newUser.username)) { flash('Username already exists.'); return }
    const updated = [...users, newUser]
    saveUsers(updated); setUsers(updated); setShowAdd(false); flash('User added.')
  }, [users, flash])

  const handleSaveEdit = useCallback((data) => {
    const updated = users.map((u, i) => i === editIdx ? { ...data } : u)
    saveUsers(updated); setUsers(updated); setEditIdx(null); flash('User updated.')
  }, [users, editIdx, flash])

  const handleDelete = useCallback((idx) => {
    if (users[idx].username === DEFAULT_ADMIN) { flash('Cannot delete main admin.'); return }
    if (users[idx].username === currentUser?.username) { flash('Cannot delete yourself.'); return }
    const updated = users.filter((_, i) => i !== idx)
    saveUsers(updated); setUsers(updated); setConfirmDelete(null); flash('User deleted.')
  }, [users, currentUser, flash])

  const UserList = ({ mobile }) => (
    <>
      {users.map((u, idx) => {
        const isSelf = u.username === currentUser?.username
        const isMain = u.username === DEFAULT_ADMIN
        const isEditing = editIdx === idx
        const props = {
          key: idx, u, idx, isSelf, isMain, isEditing,
          onEdit: () => setEditIdx(idx),
          onDelete: () => setConfirmDelete(idx),
          onSave: handleSaveEdit,
          onCancelEdit: () => setEditIdx(null),
        }
        return mobile
          ? <UserCard {...props} />
          : <UserRow {...props} showPass={showPassIdx === idx} onTogglePass={() => setShowPassIdx(showPassIdx === idx ? null : idx)} />
      })}
    </>
  )

  const Header = () => (
    <div style={{ marginBottom: 24 }}>
      <span className="tag-mono badge-yellow" style={{ marginBottom: 10, display: 'inline-block' }}>Admin · Settings</span>
      <h1 className="page-title">User Management</h1>
      <p className="page-sub">Add, edit or remove users. Only admins can see this page.</p>
    </div>
  )

  const Note = () => (
    <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--yellow-dim)', border: '1px solid rgba(255,209,102,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
      ⚠ Credentials stored in browser localStorage — suitable for internal team use.
    </div>
  )

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="desktop-only">
        <div className="desktop-page-md">
          <Header />
          {msg && <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>✓ {msg}</div>}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Users — {users.length}</span>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); setEditIdx(null) }}>+ Add User</button>
            </div>
            {showAdd && <AddUserForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
            <UserList mobile={false} />
          </div>
          <Note />
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="mobile-only">
        <div className="mobile-page">
          <Header />
          {msg && <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>✓ {msg}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); setEditIdx(null) }}>+ Add User</button>
          </div>
          {showAdd && (
            <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>New User</div>
              <div style={{ padding: 14 }}>
                <AddUserForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <UserList mobile={true} />
          </div>
          <Note />
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 18, padding: 28, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🗑</div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Delete User?</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Remove <strong>{users[confirmDelete]?.username}</strong>?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
