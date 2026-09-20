import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { coverUrl, deleteImages } from '../lib/cloudinary.js'
import { merchShop } from '../data/site.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import CoverUpload from './CoverUpload.jsx'
import { useAuth } from './useAuth.js'
import { useMerchProducts } from './useMerchProducts.js'
import './MerchList.css'

const emptyDraft = { name: '', price: '', url: '' }

export default function MerchList() {
  const { canEdit } = useAuth()
  const { products, loading, error, reload } = useMerchProducts()
  const [draft, setDraft] = useState(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  async function write(id, patch) {
    setFailure(null)

    const { error: writeError } = await supabase
      .from('merch_products')
      .update(patch)
      .eq('id', id)

    if (writeError) {
      setFailure(`A mentés nem sikerült: ${writeError.message}`)
      return
    }

    await reload()
  }

  async function changeImage(product, next) {
    if (product.image_url && product.image_url !== next) {
      deleteImages(product.image_url)
    }

    await write(product.id, { image_url: next })
  }

  async function add(event) {
    event.preventDefault()

    const name = draft.name.trim()
    const url = draft.url.trim()

    if (!name || !url) {
      setFailure('A név és a termék címe kötelező.')
      return
    }

    setBusy(true)
    setFailure(null)

    const highest = products.reduce((max, item) => Math.max(max, item.sort_order), 0)
    const { error: insertError } = await supabase.from('merch_products').insert({
      name,
      url,
      price: draft.price ? Number(draft.price) : null,
      sort_order: highest + 1,
    })

    setBusy(false)

    if (insertError) {
      setFailure(`A felvétel nem sikerült: ${insertError.message}`)
      return
    }

    setDraft(emptyDraft)
    await reload()
  }

  async function remove(product) {
    setConfirmId(null)
    setFailure(null)

    const { error: deleteError } = await supabase
      .from('merch_products')
      .delete()
      .eq('id', product.id)

    if (deleteError) {
      setFailure(`A törlés nem sikerült: ${deleteError.message}`)
      return
    }

    deleteImages(product.image_url)
    await reload()
  }

  return (
    <div>
      <div className="list-head">
        <h1>Merch</h1>
      </div>

      <p className="admin-readonly">
        Innen kerül ki a főoldali Merch szekció, ami minden betöltésnél nyolc véletlen
        terméket mutat a láthatóra állítottak közül. A kártya a megadott címre visz, tehát
        érdemes a konkrét termékoldalt megadni, nem a bolt nyitóoldalát. A bolt:{' '}
        <a href={merchShop} target="_blank" rel="noreferrer">
          {merchShop}
        </a>
      </p>

      {canEdit && (
        <form className="merch-add" onSubmit={add}>
          <label className="admin-field">
            <span>Termék neve</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>

          <label className="admin-field merch-price">
            <span>Ár (Ft)</span>
            <input
              type="number"
              min="0"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            />
          </label>

          <label className="admin-field">
            <span>Termék címe</span>
            <input
              type="url"
              value={draft.url}
              onChange={(event) => setDraft({ ...draft, url: event.target.value })}
              placeholder="https://lospolo.hu/ge-bogre"
            />
          </label>

          <button type="submit" className="admin-button" disabled={busy}>
            {busy ? 'Felvétel…' : 'Felvétel'}
          </button>
        </form>
      )}

      {failure && <p className="admin-error">{failure}</p>}
      {error && <p className="admin-error">A termékek betöltése nem sikerült.</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && products.length === 0 && <p className="list-empty">Még nincs termék.</p>}

      {products.length > 0 && (
        <table className="list-table merch-table">
          <thead>
            <tr>
              <th>Kép</th>
              <th>Név</th>
              <th>Ár</th>
              <th>Cím</th>
              <th>Látszik</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <span className="merch-shot">
                    {product.image_url && <img src={coverUrl(product.image_url)} alt="" />}
                  </span>
                </td>
                <td>
                  <input
                    className="merch-field"
                    type="text"
                    defaultValue={product.name}
                    disabled={!canEdit}
                    onBlur={(event) => {
                      const next = event.target.value.trim()

                      if (next && next !== product.name) {
                        write(product.id, { name: next })
                      } else {
                        event.target.value = product.name
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    className="merch-field merch-field--price"
                    type="number"
                    min="0"
                    defaultValue={product.price ?? ''}
                    disabled={!canEdit}
                    onBlur={(event) => {
                      const raw = event.target.value
                      const next = raw === '' ? null : Number(raw)

                      if (next !== product.price) {
                        write(product.id, { price: next })
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    className="merch-field"
                    type="url"
                    defaultValue={product.url}
                    disabled={!canEdit}
                    onBlur={(event) => {
                      const next = event.target.value.trim()

                      if (next && next !== product.url) {
                        write(product.id, { url: next })
                      } else {
                        event.target.value = product.url
                      }
                    }}
                  />
                </td>
                <td>
                  <ToggleSwitch
                    checked={product.visible}
                    onChange={(next) => write(product.id, { visible: next })}
                    label={`${product.name} megjelenítése`}
                    disabled={!canEdit}
                  />
                </td>
                <td className="merch-actions">
                  <CoverUpload
                    value={product.image_url}
                    disabled={!canEdit}
                    idle="Kép"
                    onChange={(next) => changeImage(product, next)}
                  />

                  {canEdit && confirmId !== product.id && (
                    <button
                      type="button"
                      className="cover-clear"
                      onClick={() => setConfirmId(product.id)}
                    >
                      Törlés
                    </button>
                  )}

                  {confirmId === product.id && (
                    <span className="merch-confirm">
                      <button type="button" className="cover-clear" onClick={() => remove(product)}>
                        Igen
                      </button>
                      <button type="button" className="cover-clear" onClick={() => setConfirmId(null)}>
                        Mégsem
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
