import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useLookup(table, columns = 'id, slug, name') {
  const [rows, setRows] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select(columns).order('name')
    setRows(data ?? [])
  }, [table, columns])

  useEffect(() => {
    load()
  }, [load])

  return { rows, reload: load }
}
