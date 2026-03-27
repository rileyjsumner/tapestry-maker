function ArrowIcon({ direction = 'right', title }) {
  const isRight = direction === 'right'
  return (
    <svg
      className="arrow-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M4 12h14m0 0-5-5m5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={isRight ? undefined : 'translate(24 0) scale(-1 1)'}
      />
    </svg>
  )
}

export default ArrowIcon

