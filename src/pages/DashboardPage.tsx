import type { ReactNode } from 'react'
import { BriefcaseBusiness, CheckCircle2, Clock3, ListTodo, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAsync } from '../hooks/useAsync'
import type { Profile, Project, Task, WorkSession } from '../types/database'
import { formatDuration, journeyState, localDateKey, sessionWorkedMs } from '../utils/time'
import { Alert, Badge, Card, Empty, Loading, PageHeader } from '../components/ui'

export function DashboardPage() {
  const { user } = useAuth()
  const query = useAsync(async () => {
    const [tasks, projects, sessions, profile] = await Promise.all([
      supabase.from('tasks').select('*, project:projects(id,name)').neq('status', 'completed').order('due_date', { ascending: true, nullsFirst: false }).limit(8),
      supabase.from('projects').select('*, tasks(id,status)').eq('status', 'in_progress'),
      supabase.from('work_sessions').select('*, work_breaks(*)').gte('started_at', new Date(Date.now() - 8 * 86400000).toISOString()).order('started_at', { ascending: false }),
      supabase.from('profiles').select('*').maybeSingle(),
    ])
    const error = tasks.error ?? projects.error ?? sessions.error ?? profile.error
    if (error) throw error
    return { tasks: (tasks.data ?? []) as Task[], projects: (projects.data ?? []) as Project[], sessions: (sessions.data ?? []) as WorkSession[], profile: profile.data as Profile | null }
  }, [])
  if (query.loading) return <Loading label="Montando seu painel…" />
  if (query.error) return <Alert>{query.error}</Alert>
  const today = localDateKey(new Date())
  const worked = query.data?.sessions.filter((item) => localDateKey(item.started_at) === today).reduce((sum, item) => sum + sessionWorkedMs(item), 0) ?? 0
  const active = query.data?.sessions.find((item) => !item.ended_at)
  const pending = query.data?.tasks.length ?? 0
  const high = query.data?.tasks.filter((item) => item.priority === 'high').length ?? 0
  const target = query.data?.profile?.daily_target_minutes ?? 480
  const name = query.data?.profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'profissional'
  return <>
    <PageHeader title={`Olá, ${name}`} description="Aqui está um retrato do seu trabalho agora." action={<Link className="btn btn-primary" to="/ponto"><Play size={17} />{active ? 'Ver jornada' : 'Registrar ponto'}</Link>} />
    <div className="grid-cards"><Metric label="Trabalhado hoje" value={formatDuration(worked)} icon={<Clock3 />} /><Metric label="Tarefas pendentes" value={String(pending)} icon={<ListTodo />} /><Metric label="Prioridade alta" value={String(high)} icon={<CheckCircle2 />} /><Metric label="Projetos ativos" value={String(query.data?.projects.length ?? 0)} icon={<BriefcaseBusiness />} /></div>
    <div className="split" style={{ marginTop: 18 }}>
      <Card><h2 className="section-title">Próximas tarefas</h2>{!query.data?.tasks.length ? <Empty title="Tudo em dia" text="Não há tarefas pendentes no momento." /> : <div className="table-wrap"><table className="table"><tbody>{query.data.tasks.map((task) => <tr key={task.id}><td><strong>{task.title}</strong><div className="muted">{task.project?.name ?? 'Pessoal'}</div></td><td><Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>{task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</Badge></td><td>{task.due_date ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</td></tr>)}</tbody></table></div>}</Card>
      <Card><h2 className="section-title">Jornada atual</h2><Badge tone={active ? (journeyState(active) === 'on_break' ? 'warning' : 'success') : 'neutral'}>{active ? (journeyState(active) === 'on_break' ? 'Em pausa' : 'Trabalhando') : 'Não iniciada'}</Badge><p className="metric-value">{active ? formatDuration(sessionWorkedMs(active), true) : '00:00:00'}</p><p className="muted">Meta diária: {formatDuration(target * 60000)}</p><div className="progress"><span style={{ width: `${Math.min(100, worked / (target * 600))}%` }} /></div></Card>
    </div>
  </>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <Card><div className="metric"><div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong></div><span className="metric-icon">{icon}</span></div></Card>
}
