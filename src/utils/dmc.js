import DMC_COLORS from '../data/dmcColors'

const hexToRgb = (hex) => {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

// sRGB (0-255) -> CIE L*a*b* (D65).
export const rgbToLab = (r, g, b) => {
  const lin = (c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const lr = lin(r)
  const lg = lin(g)
  const lb = lin(b)
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export const DMC_LIST = DMC_COLORS.map((color) => ({
  ...color,
  lab: rgbToLab(...hexToRgb(color.hex)),
}))

const DMC_BY_HEX = new Map(DMC_LIST.map((color) => [color.hex, color]))

export const getDmcByHex = (hex) => DMC_BY_HEX.get(String(hex).toLowerCase()) ?? null

export const dmcLabel = (color) => `DMC ${color.number}`

// Nearest DMC color by Euclidean distance in Lab (CIE76 delta E).
export const nearestDmc = (r, g, b) => {
  const [l, a, bb] = rgbToLab(r, g, b)
  let best = DMC_LIST[0]
  let bestDistance = Infinity
  for (const candidate of DMC_LIST) {
    const dl = candidate.lab[0] - l
    const da = candidate.lab[1] - a
    const db = candidate.lab[2] - bb
    const distance = dl * dl + da * da + db * db
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  return best
}

export const nearestDmcForHex = (hex) => nearestDmc(...hexToRgb(hex))

export { hexToRgb }
