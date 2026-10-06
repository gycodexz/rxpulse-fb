import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold text-brand-600 dark:text-brand-300">404</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">This page doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
    </div>
  )
}
