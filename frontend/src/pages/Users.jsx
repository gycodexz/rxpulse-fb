import { useEffect, useState } from 'react'
import { getUsers, addDocument, updateDocument, deleteDocument } from '../api/firestoreService'
import Alert from '../components/Alert'

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'institution_staff', label: 'Institution Staff' },
]

export default function Users() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('pharmacist')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (e) {
      setError(e.message || 'Could not load users from Firestore')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!name || !email) return setError('Name and Email are required')
    setSaving(true)
    setError('')
    try {
      await addDocument('users', {
        name,
        email,
        role,
        created_at: new Date().toISOString()
      })
      setSuccess(`User ${name} added successfully`)
      setName(''); setEmail(''); setRole('pharmacist')
      setFormOpen(false)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message || 'Failed to add user')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDocument('users', userId, { role: newRole })
      setSuccess('User role updated')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError('Failed to update role')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return
    try {
      await deleteDocument('users', userId)
      setSuccess(`User ${userName} deleted successfully`)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError('Failed to delete user')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage accounts, assign roles, and remove users</p>
        </div>
        <button onClick={() => { setError(''); setFormOpen(true) }} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Add New User
        </button>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading users from Firestore…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No users registered yet.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td className="font-medium text-slate-700 dark:text-slate-200">{u.name || 'User'}</td>
                  <td>{u.email}</td>
                  <td>
                    <select 
                      value={u.role || 'pharmacist'} 
                      onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                      className="text-xs px-2 py-1 bg-slate-50 dark:bg-brand-900 border border-slate-200 dark:border-brand-700 rounded font-medium text-brand-700 dark:text-brand-300 capitalize"
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(u._id || u.id, u.name || u.email)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Add New User</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="label-text">Full Name *</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Rakesh Verma" />
              </div>
              <div>
                <label className="label-text">Email Address *</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rakesh@hospital.com" />
              </div>
              <div>
                <label className="label-text">Role *</label>
                <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Add User'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
