import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, type ThemePreference } from '../contexts/ThemeContext'
import { Alert, Button, Card, Field, Input, PageHeader, Select } from '../components/ui'

export function SettingsPage() {
  const { user, signOut } = useAuth(); const { theme, setTheme } = useTheme(); const [name, setName] = useState(''); const [target, setTarget] = useState(480); const [notice, setNotice] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('profiles').select('*').maybeSingle().then(({ data }) => { if (data) { setName(data.full_name); setTarget(data.daily_target_minutes) } }) }, [])
  const save = async (event: FormEvent) => { event.preventDefault(); if (!user) return; setBusy(true); const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: name.trim(), daily_target_minutes: target }, { onConflict: 'id' }); setBusy(false); setNotice(error ? error.message : 'Configurações salvas com sucesso.') }
  return <><PageHeader title="Configurações" description="Ajuste seu perfil, aparência e meta de trabalho." />{notice && <Alert tone={notice.includes('sucesso') ? 'success' : 'error'}>{notice}</Alert>}<div className="split"><Card><h2 className="section-title">Perfil e produtividade</h2><form onSubmit={save} className="stack"><Field label="Nome completo"><Input required maxLength={140} value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="E-mail"><Input disabled value={user?.email ?? ''} /></Field><Field label="Meta diária (minutos)"><Input type="number" min={15} max={1440} required value={target} onChange={(e) => setTarget(Number(e.target.value))} /></Field><Button disabled={busy}>{busy ? 'Salvando…' : 'Salvar configurações'}</Button></form></Card><Card><h2 className="section-title">Aparência e sessão</h2><div className="stack"><Field label="Tema"><Select value={theme} onChange={(e) => setTheme(e.target.value as ThemePreference)}><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Automático (sistema)</option></Select></Field><Button variant="danger" onClick={() => void signOut()}>Encerrar sessão</Button></div></Card></div></>
}
