function PalettePanel({
  colorCount,
  paletteColors,
  selectedBrushIndex,
  onColorCountChange,
  onSelectBrush,
  onUpdateBrushColor,
}) {
  return (
    <>
      <p className="subtitle">Choose brush colors for this project.</p>

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
        {paletteColors.map((colorValue, brushIndex) => (
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
        ))}
      </div>
    </>
  )
}

export default PalettePanel
