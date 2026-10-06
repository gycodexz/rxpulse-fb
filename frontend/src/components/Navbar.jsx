import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const SERVICES = [
  { label: 'Drug Catalog', path: '/drugs', desc: 'Manage the master drug list' },
  { label: 'Vendors', path: '/vendors', desc: 'Suppliers & drug licenses' },
  { label: 'Institutions', path: '/institutions', desc: 'Hospitals & clinics' },
  { label: 'Purchase Orders', path: '/purchase-orders', desc: 'Buying from vendors' },
  { label: 'Inventory', path: '/inventory', desc: 'Stock movements in/out' },
  { label: 'Distributions', path: '/distributions', desc: 'Dispatch to institutions' },
]

export default function Navbar({ onToggleSidebar }) {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const servicesRef = useRef(null)
  const userRef = useRef(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  useEffect(() => {
    function onClickOutside(e) {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-brand-800 bg-white/90 dark:bg-brand-950/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-md p-2 hover:bg-slate-100 dark:hover:bg-brand-800"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button onClick={() => navigate('/dashboard')} className="hidden sm:block">
            <Logo />
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <div className="relative" ref={servicesRef}>
            <button
              onClick={() => setServicesOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-800"
            >
              Services
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {servicesOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-brand-800 bg-white dark:bg-brand-900 shadow-card p-2 grid gap-0.5">
                {SERVICES.map((s) => (
                  <button
                    key={s.path}
                    onClick={() => { navigate(s.path); setServicesOpen(false) }}
                    className="text-left rounded-lg px-3 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
                  >
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => navigate('/dashboard')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-800">
            Dashboard
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2.5 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800"
            aria-label="Toggle theme"
            title="Toggle dark / light mode"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
            )}
          </button>

          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg pl-2 pr-3 py-1.5 hover:bg-slate-100 dark:hover:bg-brand-800"
            >
              <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-tight">{user?.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-brand-800 bg-white dark:bg-brand-900 shadow-card p-1.5">
                <button
                  onClick={logout}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export { SERVICES }
