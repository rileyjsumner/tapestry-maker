import { useState } from 'react'

function MergeBrushesModal({
  paletteColors,
  onConfirm,
  onCancel,
}) {
  const [selectedIndices, setSelectedIndices] = useState([])
  const [targetColor, setTargetColor] = useState(paletteColors[0] ?? '#000000')

  const handleToggleSelection = (index) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      }
      return [...prev, index]
    })
  }

  const handleConfirm = () => {
    if (selectedIndices.length < 2) {
      alert('Please select at least 2 brushes to merge')
      return
    }
    onConfirm(selectedIndices, targetColor)
  }

  return (
    <div className="merge-modal-overlay">
      <div className="merge-modal">
        <h2>Merge Brushes</h2>
        
        <div className="merge-modal-section">
          <label className="merge-modal-label">Select brushes to merge:</label>
          <div className="merge-brush-list">
            {paletteColors.map((color, index) => (
              <label key={index} className="merge-brush-item">
                <input
                  type="checkbox"
                  checked={selectedIndices.includes(index)}
                  onChange={() => handleToggleSelection(index)}
                />
                <div
                  className="merge-brush-swatch"
                  style={{ backgroundColor: color }}
                />
                <span className="merge-brush-hex">{color}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="merge-modal-section">
          <label className="merge-modal-label">Merge color:</label>
          <div className="merge-color-picker">
            <input
              type="color"
              value={targetColor}
              onChange={(e) => setTargetColor(e.target.value)}
              className="merge-color-input"
            />
            <span className="merge-color-hex">{targetColor}</span>
          </div>
        </div>

        <div className="merge-modal-actions">
          <button type="button" onClick={handleConfirm} className="merge-confirm-btn">
            Merge
          </button>
          <button type="button" onClick={onCancel} className="merge-cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default MergeBrushesModal
