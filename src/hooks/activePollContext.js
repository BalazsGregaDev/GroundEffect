import { createContext } from 'react'

export const ActivePollContext = createContext({
  poll: null,
  loading: true,
  reload: () => {},
})
