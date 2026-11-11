import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './ui'
export function ProtectedRoute() { const { user, loading } = useAuth(); if (loading) return <Loading label="Restaurando sua sessão…" />; return user ? <Outlet /> : <Navigate to="/login" replace /> }
