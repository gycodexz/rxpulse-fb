import CrudPage from '../components/CrudPage'
import { useAuth } from '../context/AuthContext'

const TYPES = ['hospital', 'clinic', 'phc', 'dispensary']

export default function Institutions() {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'pharmacist'

  const fields = [
    { name: 'name', label: 'Institution name', required: true, placeholder: 'KEM Hospital' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: TYPES.map((t) => ({ value: t, label: t.toUpperCase() })) },
    { name: 'contact_person', label: 'Contact person', placeholder: 'Dr. Mehta' },
    { name: 'contact_phone', label: 'Contact phone', placeholder: '9876543210' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'kem@hospital.com' },
    { name: 'address_street', label: 'Street', placeholder: 'Acharya Donde Marg' },
    { name: 'address_city', label: 'City', placeholder: 'Mumbai' },
    { name: 'address_state', label: 'State', placeholder: 'Maharashtra' },
    { name: 'address_pincode', label: 'Pincode', placeholder: '400012' },
  ]

  const columns = [
    { key: 'name', label: 'Institution' },
    { key: 'type', label: 'Type', render: (i) => <span className="capitalize font-medium">{i.type}</span> },
    { key: 'contact_person', label: 'Contact' },
    { key: 'address_city', label: 'City', render: (i) => i.address_city || i.address?.city || '—' },
  ]

  return (
    <CrudPage
      title="Institutions"
      subtitle="Hospitals, clinics and PHCs receiving drugs"
      collectionName="institutions"
      fields={fields}
      columns={columns}
      canWrite={canWrite}
    />
  )
}
