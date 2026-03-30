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

const DEFAULT_PALETTE = ['#111111', '#ffffff', '#d14343', '#3b82f6']

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
    setProject({
      name: projectName.trim() || 'Untitled Project',
      width: parsedWidth,
      height: parsedHeight,
    })
    setColorCount('4')
    setPaletteColors(DEFAULT_PALETTE)
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
        nextColors.push('#000000')
      }
      return nextColors
    })
    setSelectedBrushIndex((previousBrushIndex) =>
      previousBrushIndex >= nextColorCount ? nextColorCount - 1 : previousBrushIndex,
    )
  }

  const updateBrushColor = (brushIndex, nextColor) => {
    setPaletteColors((previousColors) =>
      previousColors.map((colorValue, index) =>
        index === brushIndex ? nextColor : colorValue,
      ),
    )
  }

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
      if (previousPixels[pixelIndex] === selectedBrushColor) {
        return previousPixels
      }

      const nextPixels = [...previousPixels]
      nextPixels[pixelIndex] = selectedBrushColor
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
      version: 2,
      project: {
        name: project.name,
        width: project.width,
        height: project.height,
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

        if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) {
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

        setProject({
          name: parsed.project.name || 'Imported Project',
          width: nextWidth,
          height: nextHeight,
        })

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

      const { palette, indexMap } = quantizeMedianCut(pixels, desiredCount)
      if (!palette.length || indexMap.length !== pixels.length) {
        throw new Error('Failed to quantize image.')
      }

      const nextPaletteColors = palette.map((c) => rgbToHex(c.r, c.g, c.b))
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
        <section className="panel">
          {!project ? (
            <ProjectForm
              projectName={projectName}
              widthInput={widthInput}
              heightInput={heightInput}
              onProjectNameChange={setProjectName}
              onWidthChange={setWidthInput}
              onHeightChange={setHeightInput}
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
                <button
                  type="button"
                  className={editorMode === 'crochet' ? 'is-active' : ''}
                  onClick={() => switchMode('crochet')}
                >
                  Crochet
                </button>
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

                <PalettePanel
                  colorCount={colorCount}
                  paletteColors={paletteColors}
                  selectedBrushIndex={selectedBrushIndex}
                  onColorCountChange={handleColorCountChange}
                  onSelectBrush={setSelectedBrushIndex}
                  onUpdateBrushColor={updateBrushColor}
                />
              </>
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

        <section className="panel">
          {project ? (
            <PixelGrid
              project={project}
              pixelColors={pixelColors}
              editorMode={editorMode}
              crochetPattern={crochetPattern}
              activeCrochetRow={activeCrochetRow}
              activeC2cTier={activeC2cTier}
              activeRowRuns={activeRowRuns}
              rowDirections={crochetRowDirections}
              onToggleBottomDirection={toggleBottomRowDirection}
              onPixelPointerDown={handlePixelPointerDown}
              onPixelPointerEnter={handlePixelPointerEnter}
              onStopPainting={stopPainting}
            />
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
