import { useEffect, useState } from 'react'
import { getCollection, addDocument, deleteDocument } from '../api/firestoreService'
import Alert from './Alert'

export default function CrudPage({ title, subtitle, collectionName, fields, columns, canWrite = true, buildPayload }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCollection(collectionName)
      setItems(data)
    } catch (e) {
      setError(e.message || 'Could not load data from Firestore')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [collectionName])

  const openForm = () => {
    const initial = {}
    fields.forEach((f) => { initial[f.name] = f.default ?? '' })
    setForm(initial)
    setError('')
    setFormOpen(true)
  }

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    for (const f of fields) {
      if (f.required && !form[f.name] && form[f.name] !== 0 && form[f.name] !== false) {
        setError(`${f.label} is required`)
        return
      }
    }
    setSaving(true)
    try {
      const payload = buildPayload ? buildPayload(form) : form
      await addDocument(collectionName, payload)
      setSuccess('Saved successfully to Firestore')
      setFormOpen(false)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message || 'Something went wrong while saving to Firestore')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDocument(collectionName, id)
      setSuccess('Deleted successfully')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message || 'Failed to delete record')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {canWrite && (
          <button onClick={openForm} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Add New
          </button>
        )}
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading from Firestore…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No records yet. Click "Add New" to create the first one.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id || item.id}>
                  {columns.map((c) => (
                    <td key={c.key} className="text-slate-700 dark:text-slate-200">
                      {c.render ? c.render(item) : (item[c.key] ?? '—')}
                    </td>
                  ))}
                  {canWrite && (
                    <td>
                      <button 
                        onClick={() => handleDelete(item._id || item.id)} 
                        className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Add {title.replace(/s$/, '')}</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="label-text">{f.label}{f.required && ' *'}</label>
                  {f.type === 'select' ? (
                    <select className="input-field" value={form[f.name] ?? ''} onChange={(e) => handleChange(f.name, e.target.value)}>
                      <option value="">Select…</option>
                      {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <input type="checkbox" checked={!!form[f.name]} onChange={(e) => handleChange(f.name, e.target.checked)} className="h-4 w-4" />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      className="input-field"
                      value={form[f.name] ?? ''}
                      onChange={(e) => handleChange(f.name, f.type === 'number' ? e.target.valueAsNumber : e.target.value)}
                      placeholder={f.placeholder || ''}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
