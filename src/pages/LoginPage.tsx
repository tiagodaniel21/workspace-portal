import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Alert, Button, Field, Input } from '../components/ui'
import { isSupabaseConfigured } from '../lib/supabase'

export function LoginPage() {
  const { user, signIn } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(null); const reason = await signIn(email, password); setError(reason); setBusy(false) }
  return <div className="login-page"><section className="login-visual"><div className="brand login-brand"><img className="brand-logo" src="/logo-horizontal.svg" alt="Tiago Daniel" /></div><div className="login-kicker">WorkSpace · Meu Escritório Digital</div><h1>Seu trabalho, organizado em um só lugar.</h1><p>Acompanhe jornadas, tarefas, clientes e projetos com uma visão clara da sua produtividade.</p><div className="login-glow" aria-hidden="true" /></section><section className="login-form-wrap"><form className="login-form" onSubmit={submit}><div className="login-mark"><img src="/logo-mark.svg" alt="" /></div><LockKeyhole color="var(--primary)" /><h2>Bem-vindo de volta</h2><p>Entre com o usuário criado no Supabase.</p>{!isSupabaseConfigured && <Alert tone="info">Configure o arquivo <code>.env</code> antes de entrar.</Alert>}{error && <Alert>{error}</Alert>}<Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field><Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field><Button type="submit" disabled={busy || !isSupabaseConfigured} style={{ width: '100%', marginTop: 8 }}>{busy ? 'Entrando…' : 'Entrar'}</Button></form></section></div>
}
