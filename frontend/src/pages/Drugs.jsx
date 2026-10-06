import { useEffect, useState } from 'react'
import { getVendors } from '../api/firestoreService'
import CrudPage from '../components/CrudPage'
import { useAuth } from '../context/AuthContext'

const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops']
const SCHEDULES = ['OTC', 'H', 'H1', 'X']

export default function Drugs() {
  const [vendors, setVendors] = useState([])
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'pharmacist'

  useEffect(() => {
    getVendors().then((data) => setVendors(data)).catch(() => {})
  }, [])

  const fields = [
    { name: 'name', label: 'Drug name', required: true, placeholder: 'Paracetamol 500mg' },
    { name: 'generic_name', label: 'Generic name', placeholder: 'Acetaminophen' },
    { name: 'manufacturer', label: 'Manufacturer', placeholder: 'Cipla' },
    { name: 'drug_form', label: 'Form', type: 'select', required: true, options: FORMS.map((f) => ({ value: f, label: f })) },
    { name: 'quantity', label: 'Opening quantity', type: 'number', default: 0 },
    { name: 'unit', label: 'Unit', required: true, placeholder: 'tablets' },
    { name: 'price_per_unit', label: 'Price per unit (₹)', type: 'number', required: true },
    { name: 'reorder_level', label: 'Reorder level', type: 'number', default: 50 },
    { name: 'batch_number', label: 'Batch number', placeholder: 'BT20240101' },
    { name: 'expiry_date', label: 'Expiry date', type: 'date' },
    { name: 'schedule', label: 'Schedule', type: 'select', options: SCHEDULES.map((s) => ({ value: s, label: s })), default: 'OTC' },
    { name: 'storage_condition', label: 'Storage condition', placeholder: 'cool_dry' },
    { name: 'vendor_id', label: 'Vendor', type: 'select', options: vendors.map((v) => ({ value: v._id || v.id, label: v.name })) },
  ]

  const columns = [
    { key: 'name', label: 'Drug' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'drug_form', label: 'Form' },
    {
      key: 'quantity', label: 'Stock',
      render: (d) => (
        <span className={Number(d.quantity) <= Number(d.reorder_level || 10) ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
          {d.quantity} {d.unit || 'units'}
        </span>
      ),
    },
    { key: 'price_per_unit', label: 'Price', render: (d) => `₹${d.price_per_unit || 0}` },
    { key: 'expiry_date', label: 'Expiry' },
  ]

  return (
    <CrudPage
      title="Drug Catalog"
      subtitle="Master list of all medicines tracked in the system"
      collectionName="drugs"
      fields={fields}
      columns={columns}
      canWrite={canWrite}
    />
  )
}
