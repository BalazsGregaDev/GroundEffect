import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { refreshSiteConfig } from '../lib/siteConfig.js'
import { storedSections } from '../data/sections.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import { useAuth } from './useAuth.js'
import { useSectionOrder } from './useSectionOrder.js'
import './SectionList.css'

function moved(list, fromKey, toKey) {
  const from = list.findIndex((section) => section.key === fromKey)
  const to = list.findIndex((section) => section.key === toKey)

  if (from < 0 || to < 0 || from === to) {
    return list
  }

  const next = [...list]
  const [row] = next.splice(from, 1)

  next.splice(to, 0, row)

  return next
}

function stepped(list, index, step) {
  const target = index + step

  if (target < 0 || target >= list.length) {
    return list
  }

  const next = [...list]

  next[index] = list[target]
  next[target] = list[index]

  return next
}

export default function SectionList() {
  const { canEdit } = useAuth()
  const { list, setList, loading, error } = useSectionOrder()
  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState(null)

  async function save(next) {
    setList(next)
    setFailure(null)
    setNotice(null)

    const { error: writeError } = await supabase
      .from('site_settings')
      .update({ sections_order: storedSections(next) })
      .eq('id', true)

    if (writeError) {
      setFailure(`A mentés nem sikerült: ${writeError.message}`)
      return
    }

    refreshSiteConfig()
    setNotice('Mentve.')
  }

  function drop(key) {
    const next = moved(list, dragKey, key)

    setDragKey(null)
    setOverKey(null)

    if (next !== list) {
      save(next)
    }
  }

  function step(index, direction) {
    const next = stepped(list, index, direction)

    if (next !== list) {
      save(next)
    }
  }

  return (
    <div>
      <div className="list-head">
        <h1>Szekciók</h1>
      </div>

      <p className="admin-readonly">
        Ez a főoldal sorrendje fentről lefelé. A rejtett szekció nem jelenik meg, és az
        oldal menüjéből is kimarad. Húzd a sorokat a helyükre, vagy told őket a Fel és Le
        gombokkal.
      </p>

      {failure && <p className="admin-error">{failure}</p>}
      {notice && <p className="section-notice">{notice}</p>}
      {error && <p className="admin-error">A beállítások betöltése nem sikerült.</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && (
        <ul className="sections">
          {list.map((section, index) => (
            <li
              key={section.key}
              className={[
                'section-row',
                dragKey === section.key && 'section-row--dragged',
                overKey === section.key && dragKey && dragKey !== section.key && 'section-row--over',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={canEdit}
              onDragStart={() => setDragKey(section.key)}
              onDragOver={(event) => {
                event.preventDefault()
                setOverKey(section.key)
              }}
              onDragLeave={() =>
                setOverKey((current) => (current === section.key ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault()
                drop(section.key)
              }}
              onDragEnd={() => {
                setDragKey(null)
                setOverKey(null)
              }}
            >
              <span className="section-index">{index + 1}</span>
              <span className="section-label">{section.label}</span>

              <span className="section-steps">
                <button
                  type="button"
                  className="admin-button admin-button--ghost section-step"
                  disabled={!canEdit || index === 0}
                  aria-label={`${section.label} feljebb`}
                  onClick={() => step(index, -1)}
                >
                  Fel
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost section-step"
                  disabled={!canEdit || index === list.length - 1}
                  aria-label={`${section.label} lejjebb`}
                  onClick={() => step(index, 1)}
                >
                  Le
                </button>
              </span>

              <ToggleSwitch
                checked={section.visible}
                disabled={!canEdit}
                label={`${section.label} megjelenítése`}
                onChange={(visible) =>
                  save(list.map((row) => (row.key === section.key ? { ...row, visible } : row)))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
