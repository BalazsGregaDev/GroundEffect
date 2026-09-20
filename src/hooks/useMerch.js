import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function pick(products, count) {
  const pool = [...products]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[pool[index], pool[swap]] = [pool[swap], pool[index]]
  }

  return pool.slice(0, count)
}

export function useMerch(count) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('merch_products')
      .select('id, name, price, url, image_url')
      .eq('visible', true)
      .order('sort_order')
      .then(({ data }) => {
        if (active) {
          setProducts(pick(data ?? [], count))
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [count])

  return { products, loading }
}
