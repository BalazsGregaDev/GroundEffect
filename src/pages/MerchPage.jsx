import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { coverUrl } from '../lib/cloudinary.js'
import { merchShop } from '../data/site.js'
import SectionTitle from '../components/SectionTitle.jsx'
import '../components/MerchGrid.css'
import '../styles/skeleton.css'

function price(value) {
  return value === null || value === undefined ? null : `${value.toLocaleString('hu-HU')} Ft`
}

export default function MerchPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('merch_products')
      .select('id, name, price, url, image_url')
      .eq('visible', true)
      .order('price', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (active) {
          setProducts(data ?? [])
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="merch">
      <Link to="/" className="merch-back">
        Vissza a főoldalra
      </Link>

      <SectionTitle linkLabel="Tovább a boltba" linkHref={merchShop}>
        Összes termék
      </SectionTitle>

      {loading && (
        <div className="merch-grid" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span className="skel merch-skel" key={index} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="merch-empty">Még nincs felvett termék.</p>
      )}

      {products.length > 0 && (
        <div className="merch-grid">
          {products.map((product) => (
            <a
              className="mcard"
              key={product.id}
              href={product.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="mcard-shot">
                {product.image_url ? (
                  <img src={coverUrl(product.image_url)} alt="" loading="lazy" />
                ) : (
                  <span className="mcard-nophoto" aria-hidden="true">
                    Ground Effect
                  </span>
                )}
              </span>

              <span className="mcard-name">{product.name}</span>
              {price(product.price) && <span className="mcard-price">{price(product.price)}</span>}
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
