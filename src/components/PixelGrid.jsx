import { useEffect, useMemo, useRef } from 'react'
import CrochetC2cArrows from './CrochetC2cArrows'
import CrochetRowArrows from './CrochetRowArrows'
import { contrastColor, EMPTY_COLOR } from '../utils/crossStitch'
import {
  getTierCellIndices,
  getTierIndexForPixelIndex,
  getTierCenterPx,
  rotatePointClockwise,
} from '../utils/c2cTiers'

function PixelGrid({
  project,
  pixelColors,
  editorMode,
  crochetPattern,
  activeCrochetRow,
  activeC2cTier,
  activeRowRuns,
  rowDirections,
  pixelZoom,
  symbolsByHex,
  bwMode,
  hoop,
  onHoopMove,
  onToggleBottomDirection,
  onPixelPointerDown,
  onPixelPointerEnter,
  onStopPainting,
}) {
  const dragRef = useRef(null)
  const hoopRef = useRef(null)
  const hoopKey = hoop ? `${hoop.label}-${hoop.radius}` : ''

  // The padding that makes room for the hoop pushes the pattern off-screen, so bring it into view.
  useEffect(() => {
    if (hoopKey && hoopRef.current?.scrollIntoView) {
      hoopRef.current.scrollIntoView({ block: 'center', inline: 'center' })
    }
  }, [hoopKey])
  const cellSize = 18
  const cellGap = 1
  const cellPitch = (cellSize + cellGap) * pixelZoom

  const isCrossStitch = project.craft === 'crossStitch'
  const showHoop = isCrossStitch && editorMode === 'crossStitch' && hoop
  const hoopRadiusPx = showHoop ? (hoop.radius * cellPitch) : 0

  const handleHoopPointerDown = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      cx: hoop.cx,
      cy: hoop.cy,
    }
  }

  const handleHoopPointerMove = (event) => {
    const start = dragRef.current
    if (!start) return
    const nextX = start.cx + (event.clientX - start.x) / cellPitch
    const nextY = start.cy + (event.clientY - start.y) / cellPitch
    onHoopMove(
      Math.max(0, Math.min(project.width, nextX)),
      Math.max(0, Math.min(project.height, nextY)),
    )
  }

  const handleHoopPointerUp = () => {
    dragRef.current = null
  }

  const isC2c = editorMode === 'crochet' && crochetPattern === 'cornerToCorner'
  const isSideToSide = editorMode === 'crochet' && crochetPattern === 'sideToSide'

  const showSideArrows =
    isSideToSide && rowDirections && rowDirections.length > 0

  const activeTierIndices = isC2c
    ? getTierCellIndices(project.width, project.height, activeC2cTier)
    : null

  const c2cGeometry = useMemo(() => {
    if (!isC2c || !project) {
      return null
    }
    const gw = project.width * cellPitch - cellGap
    const gh = project.height * cellPitch - cellGap
    const rad = -Math.atan2(gw, gh)
    const deg = (rad * 180) / Math.PI
    const margin = 16
    const aabbW = gw * Math.cos(rad) + gh * Math.sin(rad)
    const aabbH = gw * Math.sin(rad) + gh * Math.cos(rad)
    const containerW = aabbW + 2 * margin
    const containerH = aabbH + 2 * margin
    const cx0 = containerW / 2
    const cy0 = containerH / 2
    const gridLeft = (containerW - gw) / 2
    const gridTop = (containerH - gh) / 2
    return {
      gw,
      gh,
      rad,
      deg,
      containerW,
      containerH,
      cx0,
      cy0,
      gridLeft,
      gridTop,
    }
  }, [cellGap, cellPitch, isC2c, project])

  const c2cArrowItems = useMemo(() => {
    if (!c2cGeometry || !rowDirections || rowDirections.length === 0 || !project) {
      return []
    }
    const { rad, cx0, cy0, gridLeft, gridTop } = c2cGeometry
    return rowDirections.map((row) => {
      const { cx, cy } = getTierCenterPx(
        project.width,
        project.height,
        cellPitch,
        cellSize,
        row.tierIndex,
      )
      const gx = gridLeft + cx
      const gy = gridTop + cy
      const { y: ry } = rotatePointClockwise(gx, gy, cx0, cy0, rad)
      return { ...row, topPx: ry }
    })
  }, [c2cGeometry, cellPitch, cellSize, project, rowDirections])

  const runCenterForC2c = (startAlongTier, length) => {
    const indices = activeTierIndices
    if (!indices || indices.length === 0) {
      return { left: 0, top: 0 }
    }
    const slice = indices.slice(startAlongTier, startAlongTier + length)
    let sx = 0
    let sy = 0
    for (const idx of slice) {
      const col = idx % project.width
      const row = Math.floor(idx / project.width)
      sx += col * cellPitch + cellSize / 2
      sy += row * cellPitch + cellSize / 2
    }
    const n = slice.length
    return { left: sx / n, top: sy / n }
  }

  const gridBody = (
    <div
      className={`pixel-grid ${editorMode !== 'edit' ? 'is-crochet-mode' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${project.width}, ${cellSize * pixelZoom}px)`,
        gap: `${cellGap * pixelZoom}px`,
        position: 'relative',
        width: c2cGeometry ? c2cGeometry.gw * pixelZoom : undefined,
        height: c2cGeometry ? c2cGeometry.gh * pixelZoom : undefined,
      }}
    >
      {pixelColors.map((colorValue, pixelIndex) => {
        const pixelRow = Math.floor(pixelIndex / project.width)
        let isActiveCrochet = false
        let isCompletedCrochet = false

        if (editorMode === 'crochet') {
          if (isC2c) {
            const tier = getTierIndexForPixelIndex(
              project.width,
              project.height,
              pixelIndex,
            )
            isActiveCrochet = tier === activeC2cTier
            isCompletedCrochet = tier < activeC2cTier
          } else {
            isActiveCrochet = pixelRow === activeCrochetRow
            isCompletedCrochet = pixelRow > activeCrochetRow
          }
        }

        const pixelCol = pixelIndex % project.width
        const isStitched = isCrossStitch && colorValue !== EMPTY_COLOR
        const symbol = isStitched ? symbolsByHex?.[colorValue] : null
        const tenClasses = isCrossStitch
          ? `${(pixelCol + 1) % 10 === 0 ? ' ten-col' : ''}${(pixelRow + 1) % 10 === 0 ? ' ten-row' : ''}`
          : ''

        return (
          <button
            key={pixelIndex}
            type="button"
            className={`pixel-cell ${isActiveCrochet ? 'crochet-active-row' : ''} ${isCompletedCrochet ? 'crochet-completed-row' : ''}${isCrossStitch ? ' pixel-cell--stitch' : ''}${tenClasses}`}
            style={{
              backgroundColor: bwMode && isCrossStitch ? '#ffffff' : colorValue,
              color: bwMode ? '#000000' : contrastColor(colorValue),
              fontSize: isCrossStitch ? `${cellSize * 0.7 * pixelZoom}px` : undefined,
              width: `${cellSize * pixelZoom}px`,
              height: `${cellSize * pixelZoom}px`,
            }}
            aria-label={`Pixel ${pixelIndex + 1}`}
            onPointerDown={
              editorMode === 'edit' ? () => onPixelPointerDown(pixelIndex) : undefined
            }
            onPointerEnter={
              editorMode === 'edit' ? () => onPixelPointerEnter(pixelIndex) : undefined
            }
          >
            {symbol}
          </button>
        )
      })}

      {showHoop && (
        <div
          className={`hoop-overlay ${hoop.fits ? 'is-fit' : 'is-overflow'}`}
          style={{
            left: `${hoop.cx * cellPitch - hoopRadiusPx}px`,
            top: `${hoop.cy * cellPitch - hoopRadiusPx}px`,
            width: `${hoopRadiusPx * 2}px`,
            height: `${hoopRadiusPx * 2}px`,
          }}
          ref={hoopRef}
          role="img"
          aria-label={`${hoop.label} hoop overlay`}
          onPointerDown={handleHoopPointerDown}
          onPointerMove={handleHoopPointerMove}
          onPointerUp={handleHoopPointerUp}
        />
      )}

      {editorMode === 'crochet' &&
        !isC2c &&
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

      {editorMode === 'crochet' &&
        isC2c &&
        activeRowRuns.map((run, runIndex) => {
          const { left, top } = runCenterForC2c(run.startAlongTier, run.length)
          return (
            <span
              key={`run-c2c-${runIndex}-${run.startAlongTier}`}
              className="stitch-count-chip"
              style={{ left: `${left}px`, top: `${top}px` }}
              aria-hidden="true"
            >
              {run.length}
            </span>
          )
        })}
    </div>
  )

  const gridWithSideArrows = showSideArrows ? (
    <div className="pixel-grid-and-arrows">
      {gridBody}
      <CrochetRowArrows
        activeCrochetRow={activeCrochetRow}
        cellPitch={cellPitch}
        cellSize={cellSize}
        gridHeight={project.height}
        rowDirections={rowDirections}
        onToggleBottomDirection={onToggleBottomDirection}
      />
    </div>
  ) : (
    gridBody
  )

  const c2cLayout =
    isC2c && editorMode === 'crochet' && c2cGeometry ? (
      <div
        className="crochet-c2c-layout"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          width: 'max-content',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: c2cGeometry.containerW,
            height: c2cGeometry.containerH,
            flexShrink: 0,
          }}
        >
          <div
            className="crochet-c2c-rotated-grid"
            style={{
              position: 'absolute',
              left: c2cGeometry.gridLeft,
              top: c2cGeometry.gridTop,
              width: c2cGeometry.gw,
              height: c2cGeometry.gh,
              transform: `rotate(${c2cGeometry.deg}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {gridWithSideArrows}
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            width: '1.25rem',
            height: c2cGeometry.containerH,
            flexShrink: 0,
          }}
        >
          <CrochetC2cArrows
            items={c2cArrowItems}
            onToggleBottomDirection={onToggleBottomDirection}
          />
        </div>
      </div>
    ) : null

  const wrapped =
    isC2c && editorMode === 'crochet' && c2cGeometry ? c2cLayout : gridWithSideArrows

  // The hoop can extend past the grid edges, so leave room around the grid for it.
  const content = isCrossStitch ? (
    <div className="cross-stitch-grid-wrap" style={{ padding: `${hoopRadiusPx}px` }}>
      {wrapped}
    </div>
  ) : (
    wrapped
  )

  return (
    <div
      className={`grid-scroll${isC2c ? ' grid-scroll--c2c' : ''}${isCrossStitch ? ' grid-scroll--stitch' : ''}`}
      onPointerUp={onStopPainting}
      onPointerLeave={onStopPainting}
    >
      {content}
    </div>
  )
}

export default PixelGrid
