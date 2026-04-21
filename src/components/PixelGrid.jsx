import { useMemo } from 'react'
import CrochetC2cArrows from './CrochetC2cArrows'
import CrochetRowArrows from './CrochetRowArrows'
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
  onToggleBottomDirection,
  onPixelPointerDown,
  onPixelPointerEnter,
  onStopPainting,
}) {
  const cellSize = 18
  const cellGap = 1
  const cellPitch = (cellSize + cellGap) * pixelZoom

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
      className={`pixel-grid ${editorMode === 'crochet' ? 'is-crochet-mode' : ''}`}
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

        return (
          <button
            key={pixelIndex}
            type="button"
            className={`pixel-cell ${isActiveCrochet ? 'crochet-active-row' : ''} ${isCompletedCrochet ? 'crochet-completed-row' : ''}`}
            style={{
              backgroundColor: colorValue,
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
          />
        )
      })}

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

  return (
    <div
      className={`grid-scroll${isC2c ? ' grid-scroll--c2c' : ''}`}
      onPointerUp={onStopPainting}
      onPointerLeave={onStopPainting}
    >
      {wrapped}
    </div>
  )
}

export default PixelGrid
