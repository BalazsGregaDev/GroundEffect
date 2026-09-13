import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useLookup(table) {
  const [rows, setRows] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select('id, slug, name').order('name')
    setRows(data ?? [])
  }, [table])

  useEffect(() => {
    load()
  }, [load])

  return { rows, reload: load }
}
