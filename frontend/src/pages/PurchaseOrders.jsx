import { useEffect, useState } from 'react'
import { getPurchaseOrders, getVendors, getDrugs, createPurchaseOrder, updatePurchaseOrderStatus, deleteDocument } from '../api/firestoreService'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved:  'bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-200',
  shipped:   'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

// Which role can advance which status:
// Vendor:    pending -> approved, approved -> shipped
// Pharmacist/Admin: shipped -> delivered
const canRoleAdvance = (role, currentStatus) => {
  if (role === 'vendor') {
    return currentStatus === 'pending' || currentStatus === 'approved'
  }
  if (role === 'admin' || role === 'pharmacist') {
    return currentStatus === 'pending' || currentStatus === 'approved' || currentStatus === 'shipped'
  }
  return false
}

const NEXT_STATUS = {
  pending:  'approved',
  approved: 'shipped',
  shipped:  'delivered'
}

export default function PurchaseOrders() {
  const { user } = useAuth()
  const role = user?.role || 'pharmacist'

  const [orders,  setOrders]  = useState([])
  const [vendors, setVendors] = useState([])
  const [drugs,   setDrugs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [saving,  setSaving]  = useState(false)

  const [vendorId, setVendorId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ drug_id: '', quantity_ordered: '', price_per_unit: '' }])

  const load = async () => {
    setLoading(true)
    try {
      const [o, v, d] = await Promise.all([getPurchaseOrders(), getVendors(), getDrugs()])
      setOrders(o); setVendors(v); setDrugs(d)
    } catch (e) {
      setError(e.message || 'Could not load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateItem = (idx, key, val) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  const addItemRow    = () => setItems(p => [...p, { drug_id: '', quantity_ordered: '', price_per_unit: '' }])
  const removeItemRow = (idx) => setItems(p => p.filter((_, i) => i !== idx))
  const resetForm = () => { setVendorId(''); setExpectedDelivery(''); setNotes(''); setItems([{ drug_id: '', quantity_ordered: '', price_per_unit: '' }]) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!vendorId) return setError('Please select a vendor')
    if (items.some(it => !it.drug_id || !it.quantity_ordered || !it.price_per_unit))
      return setError('Please complete every line item')

    const selectedVendor = vendors.find(v => (v._id || v.id) === vendorId)
    const payloadItems = items.map(it => {
      const drug = drugs.find(d => (d._id || d.id) === it.drug_id)
      const qty = Number(it.quantity_ordered), price = Number(it.price_per_unit)
      return { drug_id: it.drug_id, drug_name: drug?.name || 'Drug', quantity_ordered: qty, unit: drug?.unit || 'units', price_per_unit: price, total_price: qty * price }
    })
    const totalAmount = payloadItems.reduce((a, c) => a + c.total_price, 0)

    setSaving(true)
    try {
      await createPurchaseOrder({ vendor_id: vendorId, vendor_name: selectedVendor?.name || 'Vendor', items: payloadItems, total_amount: totalAmount, notes }, user)
      setSuccess('Purchase order placed successfully'); setFormOpen(false); resetForm(); load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e.message || 'Could not create order') }
    finally { setSaving(false) }
  }

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      await updatePurchaseOrderStatus(order._id || order.id, next)
      setSuccess(`Order marked as ${next}`); load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e.message || 'Could not update status') }
  }

  const handleDelete = async (id, no) => {
    if (!window.confirm(`Delete Purchase Order ${no}?`)) return
    try {
      await deleteDocument('purchase_orders', id)
      setSuccess(`Order ${no} deleted`); load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError('Could not delete order') }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'vendor'
              ? 'Orders placed with your company — approve and ship them'
              : 'Procure medicines from registered pharma vendors'}
          </p>
        </div>
        <button onClick={() => { resetForm(); setError(''); setFormOpen(true) }} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Create Order
        </button>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      {/* Role Legend Banner */}
      {role === 'vendor' && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <strong>Vendor View:</strong> You can <strong>Mark Approved</strong> (accepting the order) and <strong>Mark Shipped</strong> (dispatching goods) for orders placed with your company.
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No purchase orders yet. Click "Create Order" to add one.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr><th>PO #</th><th>Vendor</th><th>Items</th><th>Total Value</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const vendorName = o.vendor_name || vendors.find(v => (v._id || v.id) === o.vendor_id)?.name || '—'
                const orderNo = o.po_number || o.order_number || 'PO-001'
                const nextStatus = NEXT_STATUS[o.status]
                const showAdvance = nextStatus && canRoleAdvance(role, o.status)
                return (
                  <tr key={o._id || o.id}>
                    <td className="font-medium text-slate-700 dark:text-slate-200">{orderNo}</td>
                    <td>{vendorName}</td>
                    <td>{o.items?.length || 0} item(s)</td>
                    <td>₹{Number(o.total_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge capitalize ${STATUS_STYLES[o.status] || 'bg-slate-100'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-2 flex-wrap">
                      {showAdvance && (
                        <button
                          onClick={() => advanceStatus(o)}
                          className="text-brand-600 dark:text-brand-300 text-xs font-semibold px-2 py-1 bg-brand-50 dark:bg-brand-900/60 rounded hover:underline capitalize whitespace-nowrap"
                        >
                          ✓ Mark {nextStatus}
                        </button>
                      )}
                      {(role === 'admin' || role === 'pharmacist') && (
                        <button
                          onClick={() => handleDelete(o._id || o.id, orderNo)}
                          className="text-red-600 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                      {!showAdvance && role === 'vendor' && (
                        <span className="text-xs text-slate-400 italic">
                          {o.status === 'delivered' ? 'Completed ✓' : o.status === 'shipped' ? 'Awaiting delivery' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Create Purchase Order</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Vendor *</label>
                  <select className="input-field" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Expected delivery</label>
                  <input type="date" className="input-field" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-text">Line items</label>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <select className="input-field col-span-5" value={it.drug_id} onChange={e => updateItem(idx, 'drug_id', e.target.value)}>
                        <option value="">Drug…</option>
                        {drugs.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                      </select>
                      <input type="number" className="input-field col-span-3" placeholder="Qty" value={it.quantity_ordered} onChange={e => updateItem(idx, 'quantity_ordered', e.target.value)} />
                      <input type="number" className="input-field col-span-3" placeholder="₹/unit" value={it.price_per_unit} onChange={e => updateItem(idx, 'price_per_unit', e.target.value)} />
                      <button type="button" onClick={() => removeItemRow(idx)} className="col-span-1 text-red-500 hover:text-red-700" disabled={items.length === 1}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItemRow} className="text-brand-600 dark:text-brand-300 text-sm font-medium mt-2 hover:underline">+ Add line item</button>
              </div>
              <div>
                <label className="label-text">Notes</label>
                <input className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Urgent supply batch" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Placing…' : 'Place Order'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
