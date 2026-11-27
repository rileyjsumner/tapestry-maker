// Distinct, print-friendly symbols (readable in black & white). Assigned per palette slot.
export const STITCH_SYMBOLS = [
  '●', '■', '▲', '▼', '◆', '★', '✚', '✕', '○', '□', '△', '▽', '◇', '☆', '♥', '♣',
  '♠', '♦', '✱', '▬', '◐', '◑', '◒', '◓', '⬟', '⬢', '≡', '※', '¤', '§', '¶', '$',
  '#', '%', '&', '@', '+', '=', '?', '!', 'A', 'B', 'C', 'D', 'E', 'F', 'H', 'K',
  'M', 'N', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ω', 'Σ', 'Δ', 'Φ', 'Ψ',
]

export const getSymbol = (paletteIndex) =>
  STITCH_SYMBOLS[paletteIndex] ?? String(paletteIndex + 1)

export const AIDA_COUNTS = [11, 14, 16, 18, 22]
export const DEFAULT_AIDA_COUNT = 14

// Standard round embroidery hoop sizes (nominal inner diameter, inches).
export const HOOP_SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 12].map((inches) => ({
  id: `round-${inches}`,
  inches,
  label: `${inches}" round`,
}))

export const EMPTY_COLOR = '#ffffff'

// Black or white text, whichever contrasts better with the cell color.
export const contrastColor = (hex) => {
  const v = hex.replace('#', '')
  const r = Number.parseInt(v.slice(0, 2), 16)
  const g = Number.parseInt(v.slice(2, 4), 16)
  const b = Number.parseInt(v.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#111111' : '#ffffff'
}

export const formatInches = (value) => `${value.toFixed(1)}"`

// Does every stitched cell's corners lie inside a circle? Coordinates in cell units.
export const countCellsOutsideCircle = (pixelColors, width, cx, cy, radius) => {
  let outside = 0
  let total = 0
  for (let i = 0; i < pixelColors.length; i += 1) {
    if (pixelColors[i] === EMPTY_COLOR) continue
    total += 1
    const col = i % width
    const row = Math.floor(i / width)
    let inside = true
    for (const dx of [0, 1]) {
      for (const dy of [0, 1]) {
        const x = col + dx - cx
        const y = row + dy - cy
        if (x * x + y * y > radius * radius) inside = false
      }
    }
    if (!inside) outside += 1
  }
  return { outside, total }
}
