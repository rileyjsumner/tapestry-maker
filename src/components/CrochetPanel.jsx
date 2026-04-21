function CrochetPanel({
  activeRow,
  totalRows,
  activeC2cTier,
  c2cTierCount,
  crochetPattern,
  onCrochetPatternChange,
  onNextRow,
  onPreviousRow,
}) {
  return (
    <>
      <p className="subtitle">Follow the highlighted row while working your tapestry.</p>

      <div className="crochet-pattern-toggle" role="group" aria-label="Crochet pattern">
        <button
          type="button"
          className={crochetPattern === 'sideToSide' ? 'is-active' : ''}
          onClick={() => onCrochetPatternChange('sideToSide')}
        >
          Side-to-side
        </button>
        <button
          type="button"
          className={crochetPattern === 'cornerToCorner' ? 'is-active' : ''}
          onClick={() => onCrochetPatternChange('cornerToCorner')}
        >
          Corner-to-corner
        </button>
      </div>

      <p className="crochet-row-status">
        {crochetPattern === 'cornerToCorner' ? (
          <>
            Active tier: {activeC2cTier + 1} / {c2cTierCount}
          </>
        ) : (
          <>
            Active Row: {activeRow + 1} / {totalRows}
          </>
        )}
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
