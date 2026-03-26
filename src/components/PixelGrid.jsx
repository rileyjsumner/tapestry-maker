function PixelGrid({
  project,
  pixelColors,
  editorMode,
  activeCrochetRow,
  activeRowRuns,
  onPixelPointerDown,
  onPixelPointerEnter,
  onStopPainting,
}) {
  const cellSize = 18
  const cellGap = 1
  const cellPitch = cellSize + cellGap

  return (
    <div className="grid-scroll" onPointerUp={onStopPainting} onPointerLeave={onStopPainting}>
      <div
        className={`pixel-grid ${editorMode === 'crochet' ? 'is-crochet-mode' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${project.width}, ${cellSize}px)`,
          position: 'relative',
        }}
      >
        {pixelColors.map((colorValue, pixelIndex) => {
          const pixelRow = Math.floor(pixelIndex / project.width)
          const isActiveCrochetRow =
            editorMode === 'crochet' && pixelRow === activeCrochetRow
          const isCompletedCrochetRow =
            editorMode === 'crochet' && pixelRow > activeCrochetRow

          return (
            <button
              key={pixelIndex}
              type="button"
              className={`pixel-cell ${isActiveCrochetRow ? 'crochet-active-row' : ''} ${isCompletedCrochetRow ? 'crochet-completed-row' : ''}`}
              style={{ backgroundColor: colorValue }}
              aria-label={`Pixel ${pixelIndex + 1}`}
              onPointerDown={
                editorMode === 'edit' ? () => onPixelPointerDown(pixelIndex) : undefined
              }
              onPointerEnter={
                editorMode === 'edit' ? () => onPixelPointerEnter(pixelIndex) : undefined
              }
            />
          )
        })}

        {editorMode === 'crochet' &&
          activeRowRuns.map((run, runIndex) => {
            const left = run.startCol * cellPitch + (run.length * cellPitch) / 2
            const top = activeCrochetRow * cellPitch + cellSize / 2

            return (
              <span
                key={`run-${runIndex}-${run.startCol}`}
                className="stitch-count-chip"
                style={{ left: `${left}px`, top: `${top}px` }}
                aria-hidden="true"
              >
                {run.length}
              </span>
            )
          })}
      </div>
    </div>
  )
}

export default PixelGrid
