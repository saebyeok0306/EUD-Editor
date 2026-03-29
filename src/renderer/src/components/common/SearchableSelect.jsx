import React, { useState, useRef, useEffect, useMemo } from 'react'

export default function SearchableSelect({ options, value, onChange, className, style }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : value

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    const lowerQuery = searchQuery.toLowerCase()
    return options.filter(opt =>
      opt.label.toLowerCase().includes(lowerQuery) || 
      opt.value.toString().includes(lowerQuery)
    )
  }, [options, searchQuery])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      <div 
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearchQuery('')
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '0 8px',
          fontFamily: 'monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {displayLabel}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: 'var(--color-background, #1e1e20)',
          border: '1px solid var(--ev-c-brand)',
          borderRadius: '4px',
          marginTop: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--ev-c-divider)' }}>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어 입력..."
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--ev-c-divider)',
                borderRadius: '4px',
                color: 'var(--ev-c-text-1)',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                // Ignore propagate up if needed
                e.stopPropagation()
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--ev-c-text-3)', fontSize: '13px' }}>검색 결과가 없습니다.</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ev-c-brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--ev-c-text-1)',
                    backgroundColor: opt.value === value ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
                    borderLeft: opt.value === value ? '3px solid var(--ev-c-brand)' : '3px solid transparent'
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
