import type { Task } from '../types/database'

export function projectProgress(tasks: Pick<Task, 'status'>[]): number {
  if (!tasks.length) return 0
  return Math.round((tasks.filter((task) => task.status === 'completed').length / tasks.length) * 100)
}
