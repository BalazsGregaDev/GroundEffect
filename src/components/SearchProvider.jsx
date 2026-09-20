import { useEffect, useMemo, useState } from 'react'
import { SearchContext } from '../hooks/searchContext.js'
import { isSearching } from '../lib/search.js'

const fadeMs = 1000

function fadeTime() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : fadeMs
}

export default function SearchProvider({ children }) {
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('idle')
  const active = isSearching(query)

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }

    setPhase('fading')

    const timer = setTimeout(() => setPhase('hidden'), fadeTime())

    return () => clearTimeout(timer)
  }, [active])

  const value = useMemo(() => ({ query, setQuery, active, phase }), [query, active, phase])

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
