import React from 'react'
import SearchableSelect from '../../common/SearchableSelect'

export function Field({ label, value, onChange, type = "number", className = "", disabled = false, options = [] }) {
  return (
    <div className={`field-group ${className}`} style={{ opacity: disabled ? 0.6 : 1 }}>
      <label className="field-label" style={{ minWidth: '100px', flexShrink: 0 }}>{label}</label>
      <div className="value-row">
        {type === 'searchable' ? (
          <SearchableSelect
            className="modern-input"
            options={options}
            value={value ?? 0}
            onChange={(v) => onChange(v)}
            style={{ width: '100%', height: '30px', backgroundColor: 'rgba(255,255,255,0.05)' }}
          />
        ) : type === 'select' ? (
          <select className="modern-input" value={value ?? 0} onChange={(e) => onChange(parseInt(e.target.value))} disabled={disabled} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            {options.length > 0 ? options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            )) : (
              <option value={value ?? 0}>{value ?? 0}</option>
            )}
          </select>
        ) : (
          <input
            type={type}
            className="modern-input"
            value={value ?? ''}
            onChange={(e) => onChange(type === "number" ? (parseInt(e.target.value) || 0) : e.target.value)}
            disabled={disabled}
            style={{ cursor: disabled ? 'not-allowed' : 'text' }}
          />
        )}
      </div>
    </div>
  )
}

export function Card({ title, children, style }) {
  return (
    <div className="info-card" style={style}>
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}
