export default function VoteArrow({ direction }) {
  return (
    <svg
      className={direction === 'up' ? 'varrow' : 'varrow is-down'}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 21 V5 M5 12 L12 5 L19 12" />
    </svg>
  )
}
