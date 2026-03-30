import ArrowIcon from './ArrowIcon'

function CrochetRowArrows({
  activeCrochetRow,
  cellPitch,
  cellSize,
  gridHeight,
  rowDirections,
  onToggleBottomDirection,
}) {
  const bottomRowIndex = gridHeight - 1

  const rowSlotHeight = (rowIndex) =>
    rowIndex === bottomRowIndex ? cellSize : cellPitch

  return (
    <aside className="crochet-row-arrows" aria-label="Row directions">
      <div
        className="crochet-arrows-spacer"
        style={{ height: activeCrochetRow * cellPitch }}
        aria-hidden
      />
      {rowDirections.map((row) => (
        <div
          className="crochet-row-arrow"
          key={`row-arrow-${row.rowIndex}`}
          style={{ height: rowSlotHeight(row.rowIndex) }}
        >
          {row.isBottomRow ? (
            <button
              type="button"
              className="crochet-arrow-toggle"
              onClick={onToggleBottomDirection}
              aria-label="Toggle bottom row direction"
              title="Toggle bottom row direction"
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
  )
}

export default CrochetRowArrows
