import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Alert from '../components/Alert'

const ROLES = [
  { value: 'admin', label: 'Administrator (Full Access)' },
  { value: 'pharmacist', label: 'Pharmacist (Inventory & Orders)' },
  { value: 'vendor', label: 'Vendor (Order Management)' },
  { value: 'institution_staff', label: 'Institution Staff (Dispatches)' },
]

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.role) {
      setError('Please fill in all required fields')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role })
      navigate('/dashboard')
    } catch (e) {
      console.error("Firebase Registration Error:", e);
      let msg = 'Registration failed. Please try again.'
      if (e.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists.'
      } else if (e.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Get access to the drug inventory & supply chain platform</p>

          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Full name</label>
              <input className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Rajesh Kumar" />
            </div>
            <div>
              <label className="label-text">Email address</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@hospital.com" />
            </div>
            <div>
              <label className="label-text">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="">Select your role</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Password</label>
                <input type="password" className="input-field" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="label-text">Confirm</label>
                <input type="password" className="input-field" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account in Firebase…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-300 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
