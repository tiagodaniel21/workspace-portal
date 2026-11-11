import type { WorkSession } from '../types/database'

export const TIME_ZONE = 'America/Sao_Paulo'

export function sessionWorkedMs(session: WorkSession, now = new Date()): number {
  const end = session.ended_at ? new Date(session.ended_at) : now
  const total = Math.max(0, end.getTime() - new Date(session.started_at).getTime())
  const breaks = (session.work_breaks ?? []).reduce((sum, item) => {
    const breakEnd = item.ended_at ? new Date(item.ended_at) : now
    return sum + Math.max(0, breakEnd.getTime() - new Date(item.started_at).getTime())
  }, 0)
  return Math.max(0, total - breaks)
}

export function formatDuration(ms: number, withSeconds = false): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return withSeconds ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${hours}h ${String(minutes).padStart(2, '0')}min`
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function localDateKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export type JourneyState = 'not_started' | 'working' | 'on_break' | 'finished'
export function journeyState(session?: WorkSession | null): JourneyState {
  if (!session) return 'not_started'
  if (session.ended_at) return 'finished'
  return session.work_breaks?.some((item) => !item.ended_at) ? 'on_break' : 'working'
}
