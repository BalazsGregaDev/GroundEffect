import { useContext } from 'react'
import { ActivePollContext } from './activePollContext.js'

export function useActivePoll() {
  return useContext(ActivePollContext)
}
