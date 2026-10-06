import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../api/firestoreService'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'

function StatCard({ label, value, accent, onClick }) {
  return (
    <button onClick={onClick} className="card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      <div className={`mt-3 h-1 w-10 rounded-full ${accent}`} />
    </button>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getDashboardStats()
      .then((res) => setData(res))
      .catch((e) => setError(e.message || 'Could not load dashboard data from Firestore'))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{user?.role?.replace('_', ' ') || 'Pharmacist'} overview — right drugs, right place, right time</p>
      </div>

      {error && <div className="mb-5"><Alert type="error" message={error} /></div>}

      {!data ? (
        <div className="text-sm text-slate-400">Loading dashboard metrics from Firebase…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Drugs in catalog" value={data.total_drugs} accent="bg-brand-500" onClick={() => navigate('/drugs')} />
            <StatCard label="Active vendors" value={data.total_vendors} accent="bg-accent" onClick={() => navigate('/vendors')} />
            <StatCard label="Institutions served" value={data.total_institutions} accent="bg-brand-700" onClick={() => navigate('/institutions')} />
            <StatCard label="Pending orders" value={data.pending_orders} accent="bg-amber-500" onClick={() => navigate('/purchase-orders')} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card p-5 lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Low stock alerts</h2>
                <span className="badge bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">{data.low_stock_count}</span>
              </div>
              {data.low_stock_drugs.length === 0 ? (
                <p className="text-sm text-slate-400">All drugs are above reorder level.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.low_stock_drugs.map((d) => (
                    <li key={d._id || d.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-200 truncate">{d.name}</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">{d.quantity} {d.unit || 'units'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 lg:col-span-1">
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Recent purchase orders</h2>
              {data.recent_orders.length === 0 ? (
                <p className="text-sm text-slate-400">No purchase orders yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_orders.map((o) => (
                    <li key={o._id || o.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{o.po_number || o.order_number || 'PO-001'}</span>
                        <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-200 capitalize">{o.status}</span>
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">₹{Number(o.total_amount || o.total_order_value || 0).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 lg:col-span-1">
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Recent distributions</h2>
              {data.recent_distributions.length === 0 ? (
                <p className="text-sm text-slate-400">No distributions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_distributions.map((d) => (
                    <li key={d._id || d.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{d.institution_name || 'Hospital'}</span>
                        <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-200 capitalize">{d.status || 'Dispatched'}</span>
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">{d.dispatch_date || 'Today'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
