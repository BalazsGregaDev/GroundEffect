import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import { discountCodes } from '../data/site.js'
import './DiscountCodes.css'

function CodeCard({ partner, code, note, href }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="dcard">
      <div className="dcard-head">
        <a href={href} target="_blank" rel="noreferrer">
          {partner}
        </a>
        <span>{note}</span>
      </div>

      <button type="button" className="dcard-code" onClick={copy}>
        <span>{code}</span>
        <small>{copied ? 'Másolva' : 'Másolás'}</small>
      </button>
    </div>
  )
}

export default function DiscountCodes() {
  return (
    <section className="discounts" id="kedvezmenyek">
      <SectionTitle>Kedvezménykódok</SectionTitle>

      <div className="discounts-grid">
        {discountCodes.map((item) => (
          <CodeCard key={item.partner} {...item} />
        ))}
      </div>
    </section>
  )
}
