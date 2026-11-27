import { AIDA_COUNTS, HOOP_SIZES, formatInches } from '../utils/crossStitch'

function CrossStitchPanel({
  width,
  height,
  aidaCount,
  onAidaCountChange,
  hoopId,
  onHoopChange,
  hoopFit,
  onResetHoop,
  bwMode,
  onBwModeChange,
  onPrint,
}) {
  const widthIn = width / aidaCount
  const heightIn = height / aidaCount
  const selectedHoop = HOOP_SIZES.find((hoop) => hoop.id === hoopId)

  return (
    <>
      <p className="subtitle">
        Your pattern is shown with a symbol for each DMC color. No row tracking is needed
        for cross stitch.
      </p>

      <div className="palette-controls">
        <label htmlFor="aidaCount">Aida cloth count</label>
        <select
          id="aidaCount"
          value={aidaCount}
          onChange={(event) => onAidaCountChange(Number(event.target.value))}
        >
          {AIDA_COUNTS.map((count) => (
            <option key={count} value={count}>
              {count} count
            </option>
          ))}
        </select>
      </div>

      <p className="cross-stitch-size">
        Finished size:{' '}
        <strong>
          {formatInches(widthIn)} × {formatInches(heightIn)}
        </strong>
        <br />
        <span className="cross-stitch-size-detail">
          {width} × {height} stitches at {aidaCount} count
        </span>
      </p>

      <div className="palette-controls">
        <label htmlFor="hoopSize">Embroidery hoop</label>
        <select
          id="hoopSize"
          value={hoopId}
          onChange={(event) => onHoopChange(event.target.value)}
        >
          <option value="">No hoop overlay</option>
          {HOOP_SIZES.map((hoop) => (
            <option key={hoop.id} value={hoop.id}>
              {hoop.label}
            </option>
          ))}
        </select>
      </div>

      {selectedHoop && hoopFit && (
        <div
          className={`hoop-status ${hoopFit.outside === 0 ? 'is-fit' : 'is-overflow'}`}
          role="status"
        >
          {hoopFit.outside === 0
            ? `Fits inside the ${selectedHoop.label} hoop.`
            : `Doesn't fit: ${hoopFit.outside} stitched cell${hoopFit.outside === 1 ? '' : 's'} fall outside the ${selectedHoop.label} hoop.`}
          <p className="cross-stitch-size-detail">
            The hoop is {selectedHoop.inches * aidaCount} stitches across at {aidaCount}{' '}
            count. Drag it to reposition.
          </p>
          <button type="button" className="hoop-reset-btn" onClick={onResetHoop}>
            Re-center hoop
          </button>
        </div>
      )}

      <label className="bw-toggle">
        <input
          type="checkbox"
          checked={bwMode}
          onChange={(event) => onBwModeChange(event.target.checked)}
        />
        Black &amp; white (symbols only)
      </label>

      <div className="file-actions">
        <button type="button" onClick={onPrint}>
          Print pattern
        </button>
      </div>
    </>
  )
}

export default CrossStitchPanel
