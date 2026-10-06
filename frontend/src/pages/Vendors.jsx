import CrudPage from '../components/CrudPage'
import { useAuth } from '../context/AuthContext'

export default function Vendors() {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'pharmacist'

  const fields = [
    { name: 'name', label: 'Vendor / company name', required: true, placeholder: 'Sun Pharma Distributors' },
    { name: 'contact_person', label: 'Contact person', placeholder: 'Amit Shah' },
    { name: 'phone', label: 'Phone', placeholder: '9876543210' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'amit@sunpharma.com' },
    { name: 'drug_license_number', label: 'Drug license number', required: true, placeholder: 'MH-2024-1234' },
    { name: 'gst_number', label: 'GST number', placeholder: '27ABCDE1234F1Z5' },
    { name: 'address_street', label: 'Street', placeholder: 'MIDC Road' },
    { name: 'address_city', label: 'City', placeholder: 'Pune' },
    { name: 'address_state', label: 'State', placeholder: 'Maharashtra' },
    { name: 'address_pincode', label: 'Pincode', placeholder: '411018' },
  ]

  const columns = [
    { key: 'name', label: 'Vendor' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'drug_license_number', label: 'License #' },
    { key: 'address_city', label: 'City', render: (v) => v.address_city || v.address?.city || '—' },
  ]

  return (
    <CrudPage
      title="Vendors"
      subtitle="Pharma suppliers and distributors"
      collectionName="vendors"
      fields={fields}
      columns={columns}
      canWrite={canWrite}
    />
  )
}
