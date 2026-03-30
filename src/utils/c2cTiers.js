/**
 * Corner-to-corner tiers from the bottom-left pixel (0, height - 1).
 * Tier t consists of cells where col + (height - 1 - row) === t (anti-diagonals),
 * t in [0, width + height - 2]. Stitch order along each tier is increasing column.
 */

export function getC2cTierCount(width, height) {
  return width + height - 1
}

/**
 * @returns {number[]} Linear indices (row-major) in stitch order for tier `tierIndex`.
 * Tier 0 is bottom-left corner only. Tiers expand upward and rightward.
 * Cells satisfy: (row - col) + (height - 1) === tierIndex
 * => row = tierIndex - (height - 1) + col
 */
export function getTierCellIndices(width, height, tierIndex) {
  const maxT = width + height - 2
  if (tierIndex < 0 || tierIndex > maxT) {
    return []
  }

  const indices = []
  for (let col = 0; col < width; col += 1) {
    const row = tierIndex - (height - 1) + col
    if (row >= 0 && row < height) {
      indices.push(row * width + col)
    }
  }
  return indices
}

/**
 * Run-length encoding along the tier's stitch order (same shape as horizontal runs for chips).
 * Each run: { startAlongTier, length, color }.
 */
export function getStitchRunsForTier(pixelColors, width, height, tierIndex) {
  const indices = getTierCellIndices(width, height, tierIndex)
  if (indices.length === 0) {
    return []
  }

  const runs = []
  let runStart = 0
  let runColor = pixelColors[indices[0]]

  for (let i = 1; i < indices.length; i += 1) {
    const c = pixelColors[indices[i]]
    if (c !== runColor) {
      runs.push({ startAlongTier: runStart, length: i - runStart, color: runColor })
      runStart = i
      runColor = c
    }
  }

  runs.push({
    startAlongTier: runStart,
    length: indices.length - runStart,
    color: runColor,
  })
  return runs
}

/** Tier index that contains only the start corner (bottom-left). */
export function getC2cStartTierIndex() {
  return 0
}

/**
 * Which anti-diagonal tier a pixel belongs to.
 * Tier 0 is at the bottom-left corner only.
 * Tiers expand upward and rightward (toward top-right) when rotated 45°.
 * Formula: (row - col) + (height - 1)
 */
export function getTierIndexForPixelIndex(width, height, pixelIndex) {
  const col = pixelIndex % width
  const row = Math.floor(pixelIndex / width)
  return (row - col) + (height - 1)
}

/** Center of tier in pixel coords (origin top-left of grid, y increases downward). */
export function getTierCenterPx(width, height, cellPitch, cellSize, tierIndex) {
  const indices = getTierCellIndices(width, height, tierIndex)
  if (indices.length === 0) {
    return { cx: 0, cy: 0 }
  }
  let sx = 0
  let sy = 0
  for (const idx of indices) {
    const col = idx % width
    const row = Math.floor(idx / width)
    sx += col * cellPitch + cellSize / 2
    sy += row * cellPitch + cellSize / 2
  }
  const n = indices.length
  return { cx: sx / n, cy: sy / n }
}

/**
 * Clockwise rotation (CSS rotate positive) around (cx0, cy0).
 */
export function rotatePointClockwise(px, py, cx0, cy0, angleRad) {
  const dx = px - cx0
  const dy = py - cy0
  const c = Math.cos(angleRad)
  const s = Math.sin(angleRad)
  const rdx = dx * c + dy * s
  const rdy = -dx * s + dy * c
  return { x: cx0 + rdx, y: cy0 + rdy }
}
