import { describe, expect, it } from 'vitest'
import type { WorkSession } from '../types/database'
import { journeyState, sessionWorkedMs } from './time'

const base: WorkSession = { id: 's', user_id: 'u', started_at: '2026-11-09T12:00:00Z', ended_at: '2026-11-09T20:00:00Z', created_at: '2026-11-09T12:00:00Z', work_breaks: [] }
describe('sessionWorkedMs', () => {
  it('calcula a duração total sem pausas', () => expect(sessionWorkedMs(base)).toBe(8 * 60 * 60 * 1000))
  it('desconta múltiplas pausas', () => expect(sessionWorkedMs({ ...base, work_breaks: [
    { id: 'b1', user_id: 'u', work_session_id: 's', started_at: '2026-11-09T14:00:00Z', ended_at: '2026-11-09T14:15:00Z', created_at: '2026-11-09T14:00:00Z' },
    { id: 'b2', user_id: 'u', work_session_id: 's', started_at: '2026-11-09T16:00:00Z', ended_at: '2026-11-09T16:45:00Z', created_at: '2026-11-09T16:00:00Z' },
  ] })).toBe(7 * 60 * 60 * 1000))
  it('desconta uma pausa ainda aberta até o instante informado', () => expect(sessionWorkedMs({ ...base, ended_at: null, work_breaks: [{ id: 'b', user_id: 'u', work_session_id: 's', started_at: '2026-11-09T13:00:00Z', ended_at: null, created_at: '2026-11-09T13:00:00Z' }] }, new Date('2026-11-09T14:00:00Z'))).toBe(60 * 60 * 1000))
})
describe('journeyState', () => { it('deriva o estado dos registros persistidos', () => { expect(journeyState(null)).toBe('not_started'); expect(journeyState({ ...base, ended_at: null })).toBe('working'); expect(journeyState({ ...base, ended_at: null, work_breaks: [{ id: 'b', user_id: 'u', work_session_id: 's', started_at: base.started_at, ended_at: null, created_at: base.started_at }] })).toBe('on_break'); expect(journeyState(base)).toBe('finished') }) })
