import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BriefcaseBusiness, CheckSquare2, Clock3, LayoutDashboard, LogOut, Menu, MoonStar, Settings, Sun, Users, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button, Select } from '../components/ui'

const links = [
  ['/dashboard', 'Visão geral', LayoutDashboard], ['/ponto', 'Controle de ponto', Clock3], ['/tarefas', 'Tarefas', CheckSquare2],
  ['/projetos', 'Projetos', BriefcaseBusiness], ['/clientes', 'Clientes', Users], ['/configuracoes', 'Configurações', Settings],
] as const

export function AppLayout() {
  const [menu, setMenu] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <div className="brand"><img className="brand-logo" src="/logo-horizontal.svg" alt="Tiago Daniel" /></div>
      <nav className="nav" aria-label="Navegação principal">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setMenu(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>)}</nav>
      <div className="sidebar-foot"><span>WorkSpace</span>Meu Escritório Digital</div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <Button className="mobile-menu" variant="ghost" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</Button>
        <div className="user-chip">{user?.email}</div>
        {theme === 'dark' ? <MoonStar size={17} /> : <Sun size={17} />}
        <Select aria-label="Tema" value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')} style={{ width: 118 }}><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Automático</option></Select>
        <Button variant="ghost" aria-label="Sair" title="Sair" onClick={() => void signOut()}><LogOut size={19} /></Button>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  </div>
}
