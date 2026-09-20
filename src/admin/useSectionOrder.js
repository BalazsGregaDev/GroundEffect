import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { mergeSections } from '../data/sections.js'

export function useSectionOrder() {
  const [list, setList] = useState(() => mergeSections([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    const { data, error: readError } = await supabase
      .from('site_settings')
      .select('sections_order')
      .maybeSingle()

    setList(mergeSections(data?.sections_order))
    setError(readError)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { list, setList, loading, error, reload }
}
