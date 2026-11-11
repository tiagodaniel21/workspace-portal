import { describe, expect, it } from 'vitest'
import { projectProgress } from './projects'
describe('projectProgress', () => { it('retorna zero sem tarefas', () => expect(projectProgress([])).toBe(0)); it('calcula e arredonda tarefas concluídas', () => expect(projectProgress([{ status: 'completed' }, { status: 'pending' }, { status: 'completed' }])).toBe(67)) })
