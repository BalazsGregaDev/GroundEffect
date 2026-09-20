import SectionTitle from './SectionTitle.jsx'
import { coverUrl } from '../lib/cloudinary.js'
import { merchShop } from '../data/site.js'
import { useMerch } from '../hooks/useMerch.js'
import '../styles/skeleton.css'
import './MerchGrid.css'

const shown = 8

function price(value) {
  return value === null || value === undefined
    ? null
    : `${value.toLocaleString('hu-HU')} Ft`
}

export default function MerchGrid() {
  const { products, loading } = useMerch(shown)

  return (
    <section className="merch" id="merch">
      <SectionTitle linkLabel="Tovább a boltba" linkHref={merchShop}>
        Merch
      </SectionTitle>

      {loading && (
        <div className="merch-grid" aria-hidden="true">
          {Array.from({ length: shown }, (_, index) => (
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
