import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const ICONS = {
  dashboard: <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z" />,
  drugs: <path d="M10.5 20.5L3.5 13.5a5 5 0 117.07-7.07l7 7a5 5 0 01-7.07 7.07zM8.5 8.5l7 7" />,
  vendors: <path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 13h6" />,
  institutions: <path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M4 21h16" />,
  orders: <path d="M9 2h6l1 4H8l1-4zM4 6h16l-1.5 14a2 2 0 01-2 2h-9a2 2 0 01-2-2L4 6z" />,
  inventory: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  distributions: <path d="M3 12h18M3 6h18M3 18h12" />,
  users: <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 010 7.75" />,
}

function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const role = user?.role || 'pharmacist'

  let links = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/drugs', label: 'Drug Catalog', icon: 'drugs' },
  ]

  if (role === 'admin' || role === 'pharmacist') {
    links.push(
      { to: '/vendors', label: 'Vendors', icon: 'vendors' },
      { to: '/institutions', label: 'Institutions', icon: 'institutions' },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: 'orders' },
      { to: '/inventory', label: 'Inventory', icon: 'inventory' },
      { to: '/distributions', label: 'Distributions', icon: 'distributions' }
    )
  } else if (role === 'vendor') {
    links.push(
      { to: '/purchase-orders', label: 'My Orders', icon: 'orders' }
    )
  } else if (role === 'institution_staff') {
    links.push(
      { to: '/distributions', label: 'Hospital Dispatches', icon: 'distributions' }
    )
  }

  if (role === 'admin') {
    links.push({ to: '/users', label: 'User Management', icon: 'users' })
  }

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-20 bg-black/30 lg:hidden" />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-30 h-screen w-64 shrink-0 border-r border-slate-200 dark:border-brand-800
        bg-white dark:bg-brand-950 transition-transform duration-200 lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-brand-800">
          <Logo />
        </div>
        <div className="p-3">
          <div className="mb-3 px-3 py-2 bg-slate-100 dark:bg-brand-900 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider flex justify-between items-center">
            <span>Role</span>
            <span className="bg-brand-600 text-white px-2 py-0.5 rounded capitalize">{role}</span>
          </div>
          <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800'
                  }`
                }
              >
                <Icon name={l.icon} />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
