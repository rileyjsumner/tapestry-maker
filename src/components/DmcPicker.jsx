import { useMemo, useState } from 'react'
import { DMC_LIST, getDmcByHex } from '../utils/dmc'

function DmcPicker({ value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const current = getDmcByHex(value)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DMC_LIST
    return DMC_LIST.filter(
      (c) => c.number.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    )
  }, [query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="dmc-picker">
      <button
        type="button"
        className="dmc-picker-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="dmc-swatch" style={{ backgroundColor: value }} />
        <span className="dmc-picker-text">
          {current ? `DMC ${current.number}` : 'Custom'}
        </span>
      </button>
      {open && (
        <>
          <div className="dmc-picker-backdrop" onClick={close} />
          <div className="dmc-picker-popover">
            <input
              type="search"
              autoFocus
              placeholder="Search number or name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search DMC colors"
            />
            <ul role="listbox" className="dmc-picker-list">
              {matches.map((color) => (
                <li key={color.number}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={color.hex === value}
                    className={color.hex === value ? 'is-active' : ''}
                    onClick={() => {
                      onChange(color.hex)
                      close()
                    }}
                  >
                    <span className="dmc-swatch" style={{ backgroundColor: color.hex }} />
                    <span className="dmc-picker-number">{color.number}</span>
                    <span className="dmc-picker-name">{color.name}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="dmc-picker-empty">No matches</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default DmcPicker
