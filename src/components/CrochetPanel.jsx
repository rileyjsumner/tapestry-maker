function CrochetPanel({ activeRow, totalRows, onNextRow, onPreviousRow }) {
  return (
    <>
      <h1>Crochet Mode</h1>
      <p className="subtitle">Follow the highlighted row while working your tapestry.</p>

      <p className="crochet-row-status">
        Active Row: {activeRow + 1} / {totalRows}
      </p>

      <div className="crochet-controls">
        <button type="button" onClick={onNextRow}>
          Next Row
        </button>
        <button type="button" onClick={onPreviousRow} aria-label="Previous Row">
          🐸
        </button>
      </div>
    </>
  )
}

export default CrochetPanel
