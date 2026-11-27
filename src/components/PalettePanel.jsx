import DmcPicker from './DmcPicker'
import { getSymbol } from '../utils/crossStitch'

function PalettePanel({
  colorCount,
  paletteColors,
  selectedBrushIndex,
  craft = 'crochet',
  onColorCountChange,
  onSelectBrush,
  onUpdateBrushColor,
}) {
  const isCrossStitch = craft === 'crossStitch'

  return (
    <>
      <p className="subtitle">
        {isCrossStitch
          ? 'Choose DMC thread colors for this project.'
          : 'Choose brush colors for this project.'}
      </p>

      <div className="palette-controls">
        <label htmlFor="colorCount">Number of Colors</label>
        <input
          id="colorCount"
          type="number"
          min="1"
          step="1"
          value={colorCount}
          onChange={(event) => onColorCountChange(event.target.value)}
        />
      </div>

      <div className="brush-list">
        {paletteColors.map((colorValue, brushIndex) =>
          isCrossStitch ? (
            <div
              key={`brush-${brushIndex}`}
              className={`brush-row ${selectedBrushIndex === brushIndex ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className="brush-row-select"
                onClick={() => onSelectBrush(brushIndex)}
                aria-pressed={selectedBrushIndex === brushIndex}
              >
                <span className="brush-symbol" aria-hidden="true">
                  {getSymbol(brushIndex)}
                </span>
                <span>Brush {brushIndex + 1}</span>
              </button>
              <DmcPicker
                value={colorValue}
                ariaLabel={`Brush ${brushIndex + 1} DMC color`}
                onChange={(hex) => onUpdateBrushColor(brushIndex, hex)}
              />
            </div>
          ) : (
            <button
              key={`brush-${brushIndex}`}
              type="button"
              className={`brush-row ${selectedBrushIndex === brushIndex ? 'is-active' : ''}`}
              onClick={() => onSelectBrush(brushIndex)}
            >
              <span>Brush {brushIndex + 1}</span>
              <input
                type="color"
                value={colorValue}
                onChange={(event) => onUpdateBrushColor(brushIndex, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Brush ${brushIndex + 1} color`}
              />
            </button>
          ),
        )}
      </div>
    </>
  )
}

export default PalettePanel
