import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useMerchProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const result = await supabase
      .from('merch_products')
      .select('id, name, price, url, image_url, visible, sort_order')
      .order('sort_order')
      .order('created_at')

    setProducts(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { products, loading, error, reload: load }
}
