import { Outlet, NavLink } from 'react-router-dom'
import { Database, LayoutDashboard, FileSpreadsheet, Settings } from 'lucide-react'
import styles from './Layout.module.css'

const navItems = [
  { to: '/import', icon: FileSpreadsheet, label: 'Import Data', part: '01' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', part: '02', disabled: true },
  { to: '/manage', icon: Database, label: 'Manage', part: '03', disabled: true },
]

export default function Layout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>PM</span>
          <span className={styles.logoText}>Plan</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label, part, disabled }) => (
            <NavLink
              key={to}
              to={disabled ? '#' : to}
              className={({ isActive }) =>
                [styles.navItem, isActive && !disabled ? styles.active : '', disabled ? styles.disabled : ''].join(' ')
              }
              onClick={e => disabled && e.preventDefault()}
            >
              <span className={styles.partNum}>{part}</span>
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
              {disabled && <span className={styles.soon}>soon</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Settings size={14} strokeWidth={1.5} color="var(--text-muted)" />
          <span>Settings</span>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}