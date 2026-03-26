// Median-cut color quantization.
//
// Input:
// - pixels: Array<[r,g,b]> where r/g/b are 0-255 ints
// - colorCount: desired number of palette colors
//
// Output:
// - palette: Array<{r,g,b}>
// - indexMap: Array<number> mapping each input pixel to a palette index

const clampInt = (value, min, max) => {
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

const getChannelRange = (pixels, channelIndex) => {
  let min = 255
  let max = 0

  for (let i = 0; i < pixels.length; i += 1) {
    const v = pixels[i][channelIndex]
    if (v < min) min = v
    if (v > max) max = v
  }

  return { min, max, range: max - min }
}

const averageColor = (pixels) => {
  let rSum = 0
  let gSum = 0
  let bSum = 0

  for (let i = 0; i < pixels.length; i += 1) {
    rSum += pixels[i][0]
    gSum += pixels[i][1]
    bSum += pixels[i][2]
  }

  const count = pixels.length || 1
  return {
    r: clampInt(Math.round(rSum / count), 0, 255),
    g: clampInt(Math.round(gSum / count), 0, 255),
    b: clampInt(Math.round(bSum / count), 0, 255),
  }
}

const splitBox = (pixels, channelIndex) => {
  const sorted = pixels.slice().sort((a, b) => a[channelIndex] - b[channelIndex])
  const mid = Math.floor(sorted.length / 2)
  const left = sorted.slice(0, mid)
  const right = sorted.slice(mid)
  return [left, right]
}

const findBestBoxToSplit = (boxes) => {
  let bestIndex = -1
  let bestRange = -1

  for (let i = 0; i < boxes.length; i += 1) {
    const boxPixels = boxes[i]
    const r = getChannelRange(boxPixels, 0).range
    const g = getChannelRange(boxPixels, 1).range
    const b = getChannelRange(boxPixels, 2).range
    const maxRange = Math.max(r, g, b)
    if (maxRange > bestRange) {
      bestRange = maxRange
      bestIndex = i
    }
  }

  return bestIndex
}

const chooseChannelToSplit = (pixels) => {
  const rRange = getChannelRange(pixels, 0).range
  const gRange = getChannelRange(pixels, 1).range
  const bRange = getChannelRange(pixels, 2).range
  if (rRange >= gRange && rRange >= bRange) return 0
  if (gRange >= rRange && gRange >= bRange) return 1
  return 2
}

const distanceSq = (a, b) => {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

export default function quantizeMedianCut(pixels, colorCount) {
  const target = Math.max(1, Math.min(256, Math.floor(colorCount || 1)))
  if (!pixels || pixels.length === 0) {
    return { palette: [], indexMap: [] }
  }

  if (target === 1) {
    const only = averageColor(pixels)
    return {
      palette: [only],
      indexMap: pixels.map(() => 0),
    }
  }

  // `boxes` is an array of pixel arrays.
  // Each iteration splits one box into two.
  const boxes = [pixels.slice()]

  while (boxes.length < target) {
    if (boxes.length >= pixels.length) break

    const bestBoxIndex = findBestBoxToSplit(boxes)
    if (bestBoxIndex === -1) break

    const boxPixels = boxes[bestBoxIndex]
    if (boxPixels.length <= 1) break

    const channelIndex = chooseChannelToSplit(boxPixels)
    const [left, right] = splitBox(boxPixels, channelIndex)

    // If a split would create an empty box, stop.
    if (left.length === 0 || right.length === 0) break

    boxes.splice(bestBoxIndex, 1, left, right)
  }

  const palette = boxes.map((boxPixels) => averageColor(boxPixels))

  const indexMap = new Array(pixels.length)
  for (let i = 0; i < pixels.length; i += 1) {
    const pr = pixels[i][0]
    const pg = pixels[i][1]
    const pb = pixels[i][2]

    let bestIndex = 0
    let bestDist = Infinity

    for (let pIndex = 0; pIndex < palette.length; pIndex += 1) {
      const cand = palette[pIndex]
      const dist = (pr - cand.r) * (pr - cand.r) + (pg - cand.g) * (pg - cand.g) + (pb - cand.b) * (pb - cand.b)
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = pIndex
      }
    }

    indexMap[i] = bestIndex
  }

  return { palette, indexMap }
}

