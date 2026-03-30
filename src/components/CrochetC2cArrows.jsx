import ArrowIcon from './ArrowIcon'

/**
 * Horizontal arrows to the right of the C2C grid (not rotated with the canvas).
 * Each item includes topPx from the parent layout (screen Y, top of layout = 0).
 */
function CrochetC2cArrows({ items, onToggleBottomDirection }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <>
      {items.map((row) => (
        <div
          key={`c2c-arrow-${row.tierIndex}`}
          className="crochet-c2c-arrow"
          style={{
            position: 'absolute',
            left: 0,
            top: row.topPx,
            transform: 'translateY(-50%)',
          }}
        >
          {row.isToggleTier ? (
            <button
              type="button"
              className="crochet-arrow-toggle"
              onClick={onToggleBottomDirection}
              aria-label="Toggle stitch direction"
              title="Toggle stitch direction"
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
    </>
  )
}

export default CrochetC2cArrows
