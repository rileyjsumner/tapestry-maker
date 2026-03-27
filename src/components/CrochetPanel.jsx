import ArrowIcon from './ArrowIcon'

function CrochetPanel({
  activeRow,
  totalRows,
  onNextRow,
  onPreviousRow,
  rowDirections,
  onToggleBottomDirection,
}) {
  return (
    <>
      <div className="crochet-panel">
        <div className="crochet-panel-main">
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
        </div>

        <aside className="crochet-row-arrows" aria-label="Row directions">
          {rowDirections.map((row) => (
            <div className="crochet-row-arrow" key={`row-arrow-${row.rowIndex}`}>
              <span className="crochet-row-label">Row {row.rowIndex + 1}</span>
              {row.isBottomRow ? (
                <button
                  type="button"
                  className="crochet-arrow-toggle"
                  onClick={onToggleBottomDirection}
                  aria-label="Toggle row directions"
                  title="Toggle row directions"
                >
                  <ArrowIcon direction={row.direction} />
                </button>
              ) : (
                <span className="crochet-arrow-static" aria-hidden="true">
                  <ArrowIcon direction={row.direction} />
                </span>
              )}
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}

export default CrochetPanel
