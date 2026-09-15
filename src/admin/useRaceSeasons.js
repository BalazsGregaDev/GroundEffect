import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useRaceSeasons() {
  const [seasons, setSeasons] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('races').select('season')
    const found = [...new Set((data ?? []).map((row) => row.season))]
    const thisYear = new Date().getFullYear()

    if (!found.includes(thisYear)) {
      found.push(thisYear)
    }

    setSeasons(found.sort((left, right) => right - left))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { seasons, reload: load }
}
