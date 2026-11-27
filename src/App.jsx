import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import CrochetPanel from './components/CrochetPanel'
import PalettePanel from './components/PalettePanel'
import PixelGrid from './components/PixelGrid'
import ProjectForm from './components/ProjectForm'
import TopNav from './components/TopNav'
import quantizeMedianCut from './utils/quantizeMedianCut'
import {
  getC2cTierCount,
  getStitchRunsForTier,
} from './utils/c2cTiers'
import EditToolbar from './components/EditToolbar'
import MergeBrushesModal from './components/MergeBrushesModal'
import CrossStitchPanel from './components/CrossStitchPanel'
import CrossStitchLegend from './components/CrossStitchLegend'
import { DMC_LIST, getDmcByHex, nearestDmc } from './utils/dmc'
import {
  AIDA_COUNTS,
  DEFAULT_AIDA_COUNT,
  EMPTY_COLOR,
  HOOP_SIZES,
  countCellsOutsideCircle,
  getSymbol,
} from './utils/crossStitch'

const DEFAULT_PALETTE = ['#111111', '#ffffff', '#d14343', '#3b82f6']
const DEFAULT_DMC_PALETTE = ['310', '321', '798', '444'].map(
  (number) => DMC_LIST.find((color) => color.number === number).hex,
)

function App() {
  const [projectName, setProjectName] = useState('')
  const [widthInput, setWidthInput] = useState('16')
  const [heightInput, setHeightInput] = useState('16')
  const [project, setProject] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [colorCount, setColorCount] = useState('4')
  const [paletteColors, setPaletteColors] = useState(DEFAULT_PALETTE)
  const [selectedBrushIndex, setSelectedBrushIndex] = useState(0)
  const [pixelColors, setPixelColors] = useState([])
  const [isPainting, setIsPainting] = useState(false)
  const [editorMode, setEditorMode] = useState('edit')
  const [activeCrochetRow, setActiveCrochetRow] = useState(0)
  const [activeC2cTier, setActiveC2cTier] = useState(0)
  const [crochetPattern, setCrochetPattern] = useState('sideToSide')
  const [bottomRowDirection, setBottomRowDirection] = useState('right')
  const [editTool, setEditTool] = useState('brush')
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [pixelZoom, setPixelZoom] = useState(1)
  const [craftInput, setCraftInput] = useState('crochet')
  const [aidaCountInput, setAidaCountInput] = useState(String(DEFAULT_AIDA_COUNT))
  const [hoopId, setHoopId] = useState('')
  const [hoopCenter, setHoopCenter] = useState(null)
  const [bwMode, setBwMode] = useState(false)

  const isCrossStitch = project?.craft === 'crossStitch'

  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const rgbToHex = (r, g, b) => {
    const toTwo = (value) => value.toString(16).padStart(2, '0')
    return `#${toTwo(r)}${toTwo(g)}${toTwo(b)}`
  }

  const handleCreateProject = (event) => {
    event.preventDefault()

    const parsedWidth = Number.parseInt(widthInput, 10)
    const parsedHeight = Number.parseInt(heightInput, 10)

    if (
      Number.isNaN(parsedWidth) ||
      Number.isNaN(parsedHeight) ||
      parsedWidth <= 0 ||
      parsedHeight <= 0
    ) {
      setErrorMessage('Width and height must both be positive whole numbers.')
      return
    }

    setErrorMessage('')
    const nextCraft = craftInput === 'crossStitch' ? 'crossStitch' : 'crochet'
    const parsedAida = Number.parseInt(aidaCountInput, 10)
    setProject({
      name: projectName.trim() || 'Untitled Project',
      width: parsedWidth,
      height: parsedHeight,
      craft: nextCraft,
      aidaCount: AIDA_COUNTS.includes(parsedAida) ? parsedAida : DEFAULT_AIDA_COUNT,
    })
    setHoopId('')
    setHoopCenter(null)
    setBwMode(false)
    setColorCount('4')
    setPaletteColors(nextCraft === 'crossStitch' ? DEFAULT_DMC_PALETTE : DEFAULT_PALETTE)
    setSelectedBrushIndex(0)
    setPixelColors(Array.from({ length: parsedWidth * parsedHeight }, () => '#ffffff'))
    setEditorMode('edit')
    setActiveCrochetRow(parsedHeight - 1)
    setActiveC2cTier(0)
    setCrochetPattern('sideToSide')
    setBottomRowDirection('right')
  }

  const handleNewProject = () => {
    setProject(null)
    setPixelColors([])
    setEditorMode('edit')
    setSelectedBrushIndex(0)
    setHoopId('')
    setHoopCenter(null)
    setPaletteColors(DEFAULT_PALETTE)
    setColorCount('4')
    setErrorMessage('')
    setIsPainting(false)

    const parsedHeight = Number.parseInt(heightInput, 10)
    const nextRow = Number.isInteger(parsedHeight) && parsedHeight > 0 ? parsedHeight - 1 : 0
    setActiveCrochetRow(nextRow)
    setActiveC2cTier(0)
    setCrochetPattern('sideToSide')
    setBottomRowDirection('right')
  }

  const handleColorCountChange = (nextInputValue) => {
    setColorCount(nextInputValue)

    const nextColorCount = Number.parseInt(nextInputValue, 10)
    if (Number.isNaN(nextColorCount) || nextColorCount <= 0) {
      return
    }

    setPaletteColors((previousColors) => {
      if (previousColors.length === nextColorCount) {
        return previousColors
      }

      if (previousColors.length > nextColorCount) {
        return previousColors.slice(0, nextColorCount)
      }

      const nextColors = [...previousColors]
      while (nextColors.length < nextColorCount) {
        if (isCrossStitch) {
          const unused = DMC_LIST.find((color) => !nextColors.includes(color.hex))
          nextColors.push(unused ? unused.hex : '#000000')
        } else {
          nextColors.push('#000000')
        }
      }
      return nextColors
    })
    setSelectedBrushIndex((previousBrushIndex) =>
      previousBrushIndex >= nextColorCount ? nextColorCount - 1 : previousBrushIndex,
    )
  }

  const updateBrushColor = (brushIndex, nextColor) => {
    const oldColor = paletteColors[brushIndex]
    
    setPaletteColors((previousColors) =>
      previousColors.map((colorValue, index) =>
        index === brushIndex ? nextColor : colorValue,
      ),
    )
    
    if (oldColor !== nextColor) {
      setPixelColors((previousPixels) =>
        previousPixels.map((colorValue) =>
          colorValue === oldColor ? nextColor : colorValue,
        ),
      )
    }
  }

  const symbolsByHex = useMemo(() => {
    const map = {}
    paletteColors.forEach((hex, index) => {
      if (!(hex in map)) map[hex] = getSymbol(index)
    })
    return map
  }, [paletteColors])

  const legendEntries = useMemo(() => {
    if (!isCrossStitch) return []
    const counts = new Map()
    for (const hex of pixelColors) {
      if (hex !== EMPTY_COLOR) counts.set(hex, (counts.get(hex) ?? 0) + 1)
    }
    return paletteColors
      .filter((hex, index) => counts.has(hex) && paletteColors.indexOf(hex) === index)
      .map((hex) => {
        const dmc = getDmcByHex(hex)
        return {
          hex,
          symbol: symbolsByHex[hex],
          dmcNumber: dmc?.number ?? null,
          name: dmc?.name ?? hex,
          count: counts.get(hex),
        }
      })
  }, [isCrossStitch, paletteColors, pixelColors, symbolsByHex])

  const hoop = useMemo(() => {
    const hoopSize = HOOP_SIZES.find((size) => size.id === hoopId)
    if (!project || !isCrossStitch || !hoopSize) return null
    const cx = hoopCenter?.x ?? project.width / 2
    const cy = hoopCenter?.y ?? project.height / 2
    const radius = (hoopSize.inches * project.aidaCount) / 2
    const { outside } = countCellsOutsideCircle(pixelColors, project.width, cx, cy, radius)
    return { label: hoopSize.label, cx, cy, radius, outside, fits: outside === 0 }
  }, [hoopCenter, hoopId, isCrossStitch, pixelColors, project])

  const selectedBrushColor = useMemo(
    () => paletteColors[selectedBrushIndex] ?? '#000000',
    [paletteColors, selectedBrushIndex],
  )

  const activeRowRuns = useMemo(() => {
    if (!project || editorMode !== 'crochet') {
      return []
    }

    if (crochetPattern === 'cornerToCorner') {
      return getStitchRunsForTier(
        pixelColors,
        project.width,
        project.height,
        activeC2cTier,
      )
    }

    const rowStartIndex = activeCrochetRow * project.width
    const rowColors = pixelColors.slice(rowStartIndex, rowStartIndex + project.width)
    if (rowColors.length === 0) {
      return []
    }

    const runs = []
    let runStart = 0
    let runColor = rowColors[0]

    for (let col = 1; col < rowColors.length; col += 1) {
      if (rowColors[col] !== runColor) {
        runs.push({ startCol: runStart, length: col - runStart, color: runColor })
        runStart = col
        runColor = rowColors[col]
      }
    }

    runs.push({ startCol: runStart, length: rowColors.length - runStart, color: runColor })
    return runs
  }, [
    activeC2cTier,
    activeCrochetRow,
    crochetPattern,
    editorMode,
    pixelColors,
    project,
  ])

  const paintPixel = (pixelIndex) => {
    setPixelColors((previousPixels) => {
      if (!project || pixelIndex < 0 || pixelIndex >= previousPixels.length) {
        return previousPixels
      }
      const targetColor = editTool === 'eraser' ? '#ffffff' : selectedBrushColor
      if (previousPixels[pixelIndex] === targetColor) {
        return previousPixels
      }

      const nextPixels = [...previousPixels]
      nextPixels[pixelIndex] = targetColor
      return nextPixels
    })
  }

  const handlePixelPointerDown = (pixelIndex) => {
    setIsPainting(true)
    paintPixel(pixelIndex)
  }

  const handlePixelPointerEnter = (pixelIndex) => {
    if (!isPainting) {
      return
    }
    paintPixel(pixelIndex)
  }

  const stopPainting = () => {
    setIsPainting(false)
  }

  const switchMode = (nextMode) => {
    if (!project) {
      return
    }
    setEditorMode(nextMode)
    if (nextMode === 'crossStitch') {
      setHoopCenter(null)
    }
    if (nextMode === 'crochet') {
      // Fresh crochet start defaults to the bottom row (side-to-side) / tier 0 (C2C).
      // Import logic restores progress and does NOT trigger this switchMode path.
      setActiveCrochetRow(project.height - 1)
      setActiveC2cTier(0)
    }
  }

  const handleCrochetPatternChange = (nextPattern) => {
    if (!project || nextPattern === crochetPattern) {
      return
    }
    setCrochetPattern(nextPattern)
    if (nextPattern === 'sideToSide') {
      setActiveCrochetRow(project.height - 1)
      setActiveC2cTier(0)
    } else {
      setActiveC2cTier(0)
      setActiveCrochetRow(project.height - 1)
    }
  }

  const toggleBottomRowDirection = () => {
    setBottomRowDirection((prev) => (prev === 'right' ? 'left' : 'right'))
  }

  const handleAidaCountChange = (nextCount) => {
    setProject((previous) => (previous ? { ...previous, aidaCount: nextCount } : previous))
    setHoopCenter(null)
  }

  const handleHoopChange = (nextId) => {
    setHoopId(nextId)
    setHoopCenter(null)
  }

  const handleZoomIn = () => {
    setPixelZoom((prev) => Math.min(prev + 0.1, 2.0))
  }

  const handleZoomOut = () => {
    setPixelZoom((prev) => Math.max(prev - 0.1, 0.1))
  }

  const handleMergeBrushes = (selectedIndices, targetColor) => {
    if (selectedIndices.length < 2) {
      return
    }

    const selectedColors = selectedIndices.map((i) => paletteColors[i])
    const newPalette = paletteColors.filter(
      (_, i) => !selectedIndices.includes(i),
    )
    newPalette.push(targetColor)

    const newPixelColors = pixelColors.map((color) => {
      if (selectedColors.includes(color)) {
        return targetColor
      }
      return color
    })

    setPaletteColors(newPalette)
    setColorCount(String(newPalette.length))
    setPixelColors(newPixelColors)

    const newSelectedIndex = newPalette.length - 1
    setSelectedBrushIndex(newSelectedIndex)

    setShowMergeModal(false)
  }

  const crochetRowDirections = useMemo(() => {
    if (!project || editorMode !== 'crochet') {
      return []
    }

    if (crochetPattern === 'cornerToCorner') {
      const rows = []
      for (let tierIndex = 0; tierIndex <= activeC2cTier; tierIndex += 1) {
        const shouldFlip = tierIndex % 2 === 1
        const direction = shouldFlip
          ? bottomRowDirection === 'right'
            ? 'left'
            : 'right'
          : bottomRowDirection
        rows.push({
          tierIndex,
          direction,
          isToggleTier: tierIndex === 0,
        })
      }
      return rows
    }

    const bottomRowIndex = project.height - 1
    const rows = []

    for (let row = activeCrochetRow; row <= bottomRowIndex; row += 1) {
      const distanceFromBottom = bottomRowIndex - row
      const shouldFlip = distanceFromBottom % 2 === 1
      const direction = shouldFlip
        ? bottomRowDirection === 'right'
          ? 'left'
          : 'right'
        : bottomRowDirection

      rows.push({
        rowIndex: row,
        direction,
        isBottomRow: row === bottomRowIndex,
      })
    }

    return rows
  }, [
    activeC2cTier,
    activeCrochetRow,
    bottomRowDirection,
    crochetPattern,
    editorMode,
    project,
  ])

  const goToNextCrochetRow = () => {
    if (!project) {
      return
    }
    if (crochetPattern === 'cornerToCorner') {
      const maxTier = getC2cTierCount(project.width, project.height) - 1
      setActiveC2cTier((previous) => Math.min(maxTier, previous + 1))
      return
    }
    setActiveCrochetRow((previousRow) => Math.max(0, previousRow - 1))
  }

  const goToPreviousCrochetRow = () => {
    if (!project) {
      return
    }
    if (crochetPattern === 'cornerToCorner') {
      setActiveC2cTier((previous) => Math.max(0, previous - 1))
      return
    }
    setActiveCrochetRow((previousRow) => Math.min(project.height - 1, previousRow + 1))
  }

  useEffect(() => {
    const handleWindowPointerUp = () => setIsPainting(false)
    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [])

  const serializeProjectToTap = () => {
    if (!project) return null

    return {
      // Crochet projects keep the v2 format; cross stitch needs v3 (craft + aida count).
      version: isCrossStitch ? 3 : 2,
      project: {
        name: project.name,
        width: project.width,
        height: project.height,
        ...(isCrossStitch ? { craft: 'crossStitch', aidaCount: project.aidaCount } : {}),
      },
      paletteColors,
      pixelColors,
      progress: {
        editorMode,
        activeCrochetRow,
        activeC2cTier,
        crochetPattern,
      },
    }
  }

  const safeFileName = (name) => {
    const base = String(name || 'tapestry')
    return base.replace(/[^\w\-]+/g, '_')
  }

  const saveProjectAsTap = () => {
    const payload = serializeProjectToTap()
    if (!payload) return

    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${safeFileName(project.name)}.tap`
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  }

  const openLoadDialog = () => {
    fileInputRef.current?.click()
  }

  const handleTapFilePicked = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const text = String(reader.result)
        const parsed = JSON.parse(text)

        if (!parsed || (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3)) {
          throw new Error('Unsupported or missing .tap version.')
        }
        if (!parsed.project) {
          throw new Error('Missing project data.')
        }

        const nextWidth = parsed.project.width
        const nextHeight = parsed.project.height

        if (!Number.isInteger(nextWidth) || nextWidth <= 0) {
          throw new Error('Invalid project width.')
        }
        if (!Number.isInteger(nextHeight) || nextHeight <= 0) {
          throw new Error('Invalid project height.')
        }

        const nextPaletteColors = parsed.paletteColors
        if (!Array.isArray(nextPaletteColors) || nextPaletteColors.length < 1) {
          throw new Error('Invalid paletteColors data.')
        }

        const nextPixelColors = parsed.pixelColors
        const expectedCells = nextWidth * nextHeight
        if (!Array.isArray(nextPixelColors) || nextPixelColors.length !== expectedCells) {
          throw new Error('Invalid pixelColors data (wrong length).')
        }

        const savedProgress = parsed.progress || {}
        const savedRow =
          typeof savedProgress.activeCrochetRow === 'number'
            ? savedProgress.activeCrochetRow
            : nextHeight - 1

        const clampedRow = Math.max(0, Math.min(nextHeight - 1, savedRow))

        const maxTierIndex = nextWidth + nextHeight - 2
        const savedPattern =
          savedProgress.crochetPattern === 'cornerToCorner'
            ? 'cornerToCorner'
            : 'sideToSide'
        const savedTier =
          typeof savedProgress.activeC2cTier === 'number'
            ? savedProgress.activeC2cTier
            : 0
        const clampedTier = Math.max(0, Math.min(maxTierIndex, savedTier))

        const nextCraft = parsed.project.craft === 'crossStitch' ? 'crossStitch' : 'crochet'
        const savedAida = parsed.project.aidaCount
        setProject({
          name: parsed.project.name || 'Imported Project',
          width: nextWidth,
          height: nextHeight,
          craft: nextCraft,
          aidaCount: AIDA_COUNTS.includes(savedAida) ? savedAida : DEFAULT_AIDA_COUNT,
        })
        setHoopId('')
        setHoopCenter(null)
        if ((nextCraft === 'crossStitch') !== isCrossStitch) {
          setEditorMode('edit')
        }

        setPaletteColors(nextPaletteColors)
        setColorCount(String(nextPaletteColors.length))
        setSelectedBrushIndex((previousIndex) =>
          Math.min(previousIndex, nextPaletteColors.length - 1),
        )

        setPixelColors(nextPixelColors)
        setActiveCrochetRow(clampedRow)
        setCrochetPattern(parsed.version >= 2 ? savedPattern : 'sideToSide')
        setActiveC2cTier(parsed.version >= 2 ? clampedTier : 0)
        setIsPainting(false)
        setErrorMessage('')
        setBottomRowDirection('right')
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error'
        setErrorMessage(`Failed to load .tap: ${message}`)
      } finally {
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      setErrorMessage('Failed to read file.')
      event.target.value = ''
    }

    reader.readAsText(file)
  }

  const openImageDialog = () => {
    imageInputRef.current?.click()
  }

  const handleImageFilePicked = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (!project) {
        return
      }

      const desiredCountRaw = Number.parseInt(colorCount, 10)
      const desiredCount = Number.isNaN(desiredCountRaw)
        ? 1
        : Math.max(1, Math.min(64, desiredCountRaw))

      setErrorMessage('')
      setIsPainting(false)

      const bitmap =
        typeof createImageBitmap === 'function'
          ? await createImageBitmap(file)
          : await new Promise((resolve, reject) => {
              const img = new Image()
              const objectUrl = URL.createObjectURL(file)
              img.onload = () => {
                URL.revokeObjectURL(objectUrl)
                resolve(img)
              }
              img.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                reject(new Error('Failed to decode image.'))
              }
              img.src = objectUrl
            })

      const canvas = document.createElement('canvas')
      canvas.width = project.width
      canvas.height = project.height

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        throw new Error('Unable to create canvas context.')
      }

      // Composite over white so transparent images still quantize predictably.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const pixels = []
      // Extract RGB triples (skip alpha, we already composited to white).
      for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push([
          imageData.data[i],
          imageData.data[i + 1],
          imageData.data[i + 2],
        ])
      }

      const quantized = quantizeMedianCut(pixels, desiredCount)
      const { palette } = quantized
      let { indexMap } = quantized
      if (!palette.length || indexMap.length !== pixels.length) {
        throw new Error('Failed to quantize image.')
      }

      let nextPaletteColors = palette.map((c) => rgbToHex(c.r, c.g, c.b))
      if (isCrossStitch) {
        // Snap each quantized color to the closest official DMC thread (Lab distance),
        // merging colors that land on the same thread.
        const snapped = palette.map((c) => nearestDmc(c.r, c.g, c.b).hex)
        nextPaletteColors = snapped.filter((hex, i) => snapped.indexOf(hex) === i)
        const remap = snapped.map((hex) => nextPaletteColors.indexOf(hex))
        indexMap = indexMap.map((paletteIndex) => remap[paletteIndex])
      }
      const nextPixelColors = indexMap.map((paletteIndex) =>
        nextPaletteColors[
          Math.max(0, Math.min(nextPaletteColors.length - 1, paletteIndex))
        ],
      )

      setPaletteColors(nextPaletteColors)
      setColorCount(String(nextPaletteColors.length))
      setSelectedBrushIndex(0)
      setPixelColors(nextPixelColors)
      setActiveCrochetRow(project.height - 1)
      setActiveC2cTier(0)
      setCrochetPattern('sideToSide')
      setEditorMode('edit')
      setBottomRowDirection('right')
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error'
      setErrorMessage(`Failed to import image: ${message}`)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <>
      <TopNav onNewProject={handleNewProject} />
      <main className="app">
        <section className="panel controls-panel">
          {!project ? (
            <ProjectForm
              projectName={projectName}
              widthInput={widthInput}
              heightInput={heightInput}
              onProjectNameChange={setProjectName}
              onWidthChange={setWidthInput}
              onHeightChange={setHeightInput}
              craft={craftInput}
              aidaCount={aidaCountInput}
              onCraftChange={setCraftInput}
              onAidaCountChange={setAidaCountInput}
              onSubmit={handleCreateProject}
              errorMessage={errorMessage}
            />
          ) : (
            <>
              <div className="file-actions">
                <button type="button" onClick={saveProjectAsTap}>
                  Save .tap
        </button>

                <button type="button" onClick={openLoadDialog}>
                  Load .tap
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".tap,.json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleTapFilePicked}
                />
        </div>

              <div className="mode-toggle">
                <button
                  type="button"
                  className={editorMode === 'edit' ? 'is-active' : ''}
                  onClick={() => switchMode('edit')}
                >
                  Edit
                </button>
                {isCrossStitch ? (
                  <button
                    type="button"
                    className={editorMode === 'crossStitch' ? 'is-active' : ''}
                    onClick={() => switchMode('crossStitch')}
                  >
                    Cross Stitch
                  </button>
                ) : (
                  <button
                    type="button"
                    className={editorMode === 'crochet' ? 'is-active' : ''}
                    onClick={() => switchMode('crochet')}
                  >
                    Crochet
                  </button>
                )}
              </div>

              {editorMode === 'edit' ? (
              <>
                <div className="file-actions">
                  <button type="button" onClick={openImageDialog}>
                    Upload Image
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFilePicked}
                  />
        </div>

                <EditToolbar
                  editTool={editTool}
                  onEditToolChange={setEditTool}
                  onOpenMergeModal={() => setShowMergeModal(true)}
                />

                <PalettePanel
                  colorCount={colorCount}
                  paletteColors={paletteColors}
                  selectedBrushIndex={selectedBrushIndex}
                  craft={project.craft}
                  onColorCountChange={handleColorCountChange}
                  onSelectBrush={setSelectedBrushIndex}
                  onUpdateBrushColor={updateBrushColor}
                />
              </>
              ) : editorMode === 'crossStitch' ? (
                <CrossStitchPanel
                  width={project.width}
                  height={project.height}
                  aidaCount={project.aidaCount}
                  onAidaCountChange={handleAidaCountChange}
                  hoopId={hoopId}
                  onHoopChange={handleHoopChange}
                  hoopFit={hoop}
                  onResetHoop={() => setHoopCenter(null)}
                  bwMode={bwMode}
                  onBwModeChange={setBwMode}
                  onPrint={() => window.print()}
                />
              ) : (
                <CrochetPanel
                  activeRow={activeCrochetRow}
                  totalRows={project.height}
                  activeC2cTier={activeC2cTier}
                  c2cTierCount={getC2cTierCount(project.width, project.height)}
                  crochetPattern={crochetPattern}
                  onCrochetPatternChange={handleCrochetPatternChange}
                  onNextRow={goToNextCrochetRow}
                  onPreviousRow={goToPreviousCrochetRow}
                />
              )}

              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </>
          )}
      </section>

      {showMergeModal && (
        <MergeBrushesModal
          paletteColors={paletteColors}
          craft={project?.craft}
          onConfirm={handleMergeBrushes}
          onCancel={() => setShowMergeModal(false)}
        />
      )}

        <section className="panel">
          {project ? (
            <div className={`pixel-grid-container${isCrossStitch ? ' pixel-grid-container--legend' : ''}`}>
              <div className="pixel-zoom-controls">
                <button
                  type="button"
                  className="pixel-zoom-btn"
                  onClick={handleZoomOut}
                  title="Zoom out"
                  disabled={pixelZoom <= 0.1}
                >
                  −
                </button>
                <span className="pixel-zoom-level">{Math.round(pixelZoom * 100)}%</span>
                <button
                  type="button"
                  className="pixel-zoom-btn"
                  onClick={handleZoomIn}
                  title="Zoom in"
                  disabled={pixelZoom >= 2.0}
                >
                  +
                </button>
              </div>
              <PixelGrid
                project={project}
                pixelColors={pixelColors}
                editorMode={editorMode}
                crochetPattern={crochetPattern}
                activeCrochetRow={activeCrochetRow}
                activeC2cTier={activeC2cTier}
                activeRowRuns={activeRowRuns}
                rowDirections={crochetRowDirections}
                pixelZoom={pixelZoom}
                symbolsByHex={symbolsByHex}
                bwMode={bwMode && editorMode === 'crossStitch'}
                hoop={hoop}
                onHoopMove={(x, y) => setHoopCenter({ x, y })}
                onToggleBottomDirection={toggleBottomRowDirection}
                onPixelPointerDown={handlePixelPointerDown}
                onPixelPointerEnter={handlePixelPointerEnter}
                onStopPainting={stopPainting}
              />
              {isCrossStitch && (
                <CrossStitchLegend
                  entries={legendEntries}
                  bwMode={bwMode && editorMode === 'crossStitch'}
                />
              )}
            </div>
          ) : (
            <p className="empty-state">
              Your grid will appear here after you create a project.
            </p>
          )}
        </section>
      </main>
    </>
  )
}

export default App
