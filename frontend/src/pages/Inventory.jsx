import { useEffect, useState } from 'react'
import { getInventoryTransactions, getDrugs, recordInventoryTransaction } from '../api/firestoreService'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'

export default function Inventory() {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'pharmacist'

  const [tx, setTx] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [drugId, setDrugId] = useState('')
  const [type, setType] = useState('in')
  const [quantity, setQuantity] = useState('')
  const [batch, setBatch] = useState('')
  const [notes, setNotes] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [t, d] = await Promise.all([getInventoryTransactions(), getDrugs()])
      setTx(t); setDrugs(d)
    } catch (e) {
      setError(e.message || 'Could not load inventory records from Firestore')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!drugId || !quantity) return setError('Please select a drug and enter a quantity')
    const drug = drugs.find((d) => (d._id || d.id) === drugId)
    setSaving(true)
    try {
      await recordInventoryTransaction({
        drug_id: drugId,
        drug_name: drug?.name || '',
        transaction_type: type,
        quantity: Number(quantity),
        reference_no: batch ? `BATCH-${batch}` : 'MANUAL',
        notes,
      })
      setSuccess('Stock transaction recorded in Firestore and Drug stock synced!')
      setFormOpen(false)
      setDrugId(''); setQuantity(''); setBatch(''); setNotes(''); setType('in')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message || 'Could not record this transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Inventory Movements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time stock audit log (Stock In & Stock Out)</p>
        </div>
        {canWrite && (
          <button onClick={() => { setError(''); setFormOpen(true) }} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Record Transaction
          </button>
        )}
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading from Firestore…</div>
        ) : tx.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No stock transactions recorded yet.</div>
        ) : (
          <table className="table-shell">
            <thead><tr><th>Drug</th><th>Type</th><th>Quantity</th><th>Ref / Batch</th><th>Notes</th></tr></thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t._id || t.id}>
                  <td className="font-medium text-slate-700 dark:text-slate-200">{t.drug_name || 'Drug'}</td>
                  <td>
                    <span className={`badge ${t.transaction_type === 'in' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>
                      {t.transaction_type === 'in' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>
                  <td className="font-medium">{t.quantity} units</td>
                  <td>{t.reference_no || '—'}</td>
                  <td className="text-xs text-slate-500">{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Record Stock Transaction</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Drug *</label>
                <select className="input-field" value={drugId} onChange={(e) => setDrugId(e.target.value)}>
                  <option value="">Select drug…</option>
                  {drugs.map((d) => <option key={d._id || d.id} value={d._id || d.id}>{d.name} ({d.quantity} {d.unit || 'units'} in stock)</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Transaction type *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setType('in')} className={`flex-1 rounded-lg py-2 text-sm font-medium border ${type === 'in' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-brand-700'}`}>Stock In</button>
                  <button type="button" onClick={() => setType('out')} className={`flex-1 rounded-lg py-2 text-sm font-medium border ${type === 'out' ? 'bg-red-600 text-white border-red-600' : 'border-slate-300 dark:border-brand-700'}`}>Stock Out</button>
                </div>
              </div>
              <div>
                <label className="label-text">Quantity *</label>
                <input type="number" className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div>
                <label className="label-text">Batch number</label>
                <input className="input-field" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="BT20240101" />
              </div>
              <div>
                <label className="label-text">Notes</label>
                <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Received against PO stock" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Record'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
