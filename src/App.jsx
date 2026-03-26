import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import CrochetPanel from './components/CrochetPanel'
import PalettePanel from './components/PalettePanel'
import PixelGrid from './components/PixelGrid'
import ProjectForm from './components/ProjectForm'

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

  const fileInputRef = useRef(null)

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
  }, [activeCrochetRow, editorMode, pixelColors, project])

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
      // Fresh crochet start defaults to the bottom row.
      // Import logic restores `activeCrochetRow` and does NOT trigger this switchMode path.
      setActiveCrochetRow(project.height - 1)
    }
  }

  const goToNextCrochetRow = () => {
    if (!project) {
      return
    }
    setActiveCrochetRow((previousRow) => Math.max(0, previousRow - 1))
  }

  const goToPreviousCrochetRow = () => {
    if (!project) {
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
      version: 1,
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

        if (!parsed || parsed.version !== 1) {
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
        setIsPainting(false)
        setErrorMessage('')
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

  return (
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
              <PalettePanel
                colorCount={colorCount}
                paletteColors={paletteColors}
                selectedBrushIndex={selectedBrushIndex}
                onColorCountChange={handleColorCountChange}
                onSelectBrush={setSelectedBrushIndex}
                onUpdateBrushColor={updateBrushColor}
              />
            ) : (
              <CrochetPanel
                activeRow={activeCrochetRow}
                totalRows={project.height}
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
            activeCrochetRow={activeCrochetRow}
            activeRowRuns={activeRowRuns}
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
  )
}

export default App
