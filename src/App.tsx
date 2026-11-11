import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { TimePage } from './pages/TimePage'
import { TasksPage } from './pages/TasksPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ClientsPage } from './pages/ClientsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/ponto" element={<TimePage />} /><Route path="/tarefas" element={<TasksPage />} /><Route path="/projetos" element={<ProjectsPage />} /><Route path="/clientes" element={<ClientsPage />} /><Route path="/configuracoes" element={<SettingsPage />} /></Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>
}
