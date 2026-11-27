function CrossStitchLegend({ entries, bwMode }) {
  if (entries.length === 0) {
    return null
  }

  return (
    <section className="cross-stitch-legend" aria-label="Thread legend">
      <h2>Legend</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Color</th>
            <th scope="col">DMC</th>
            <th scope="col">Name</th>
            <th scope="col">Stitches</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.hex}>
              <td className="legend-symbol">{entry.symbol}</td>
              <td>
                {!bwMode && (
                  <span className="dmc-swatch" style={{ backgroundColor: entry.hex }} />
                )}
              </td>
              <td>{entry.dmcNumber ? `DMC ${entry.dmcNumber}` : 'Custom'}</td>
              <td>{entry.name}</td>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default CrossStitchLegend
