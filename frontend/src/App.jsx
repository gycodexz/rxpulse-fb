import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Drugs from './pages/Drugs'
import Vendors from './pages/Vendors'
import Institutions from './pages/Institutions'
import PurchaseOrders from './pages/PurchaseOrders'
import Inventory from './pages/Inventory'
import Distributions from './pages/Distributions'
import Users from './pages/Users'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/drugs" element={<Drugs />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/distributions" element={<Distributions />} />
            <Route path="/users" element={<Users />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
