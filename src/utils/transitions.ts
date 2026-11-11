import type { JourneyState } from './time'

const allowed: Record<JourneyState, JourneyState[]> = {
  not_started: ['working'], working: ['on_break', 'finished'], on_break: ['working'], finished: [],
}
export const canTransition = (from: JourneyState, to: JourneyState) => allowed[from].includes(to)
