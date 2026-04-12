import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import DatIcon from './DatIcon'
import ImageGraphic from './ImageGraphic'

const ITEM_HEIGHT = 34   // px per list item
const OVERSCAN = 5       // extra items to render above/below viewport

export default function SearchableSelect({ options, value, onChange, className, style, renderOption, placeholder = '검색어 입력...', onNavigate, disabled = false, iconGrfPath }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)
  const listRef = useRef(null)

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

  // Auto-scroll to selected item when dropdown opens
  useEffect(() => {
    if (isOpen && !searchQuery) {
      const idx = filteredOptions.findIndex(o => o.value === value)
      if (idx >= 0 && listRef.current) {
        const targetScrollTop = Math.max(0, idx * ITEM_HEIGHT - listRef.current.clientHeight / 2)
        listRef.current.scrollTop = targetScrollTop
        setScrollTop(targetScrollTop)
      }
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    const lowerQuery = searchQuery.toLowerCase()
    return options.filter(opt =>
      opt.label.toLowerCase().includes(lowerQuery) ||
      opt.value.toString().includes(lowerQuery)
    )
  }, [options, searchQuery])

  // Detect which icon type is being used
  const hasIcons = useMemo(() => options.some(opt => opt.icon !== undefined), [options])
  const hasImageIds = useMemo(() => options.some(opt => opt.imageId !== undefined), [options])

  const THUMB_SIZE = 28

  const renderThumb = useCallback((opt) => {
    if (hasIcons) {
      return (
        <div style={{
          width: THUMB_SIZE, height: THUMB_SIZE, flexShrink: 0,
          backgroundColor: '#000', borderRadius: '3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {opt.icon !== null && opt.icon !== undefined && (
            <DatIcon
              frameIndex={opt.icon}
              grfPath={iconGrfPath || opt.grfPath}
              size={THUMB_SIZE}
              style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent' }}
            />
          )}
        </div>
      )
    }
    if (hasImageIds) {
      return (
        <div style={{
          width: THUMB_SIZE, height: THUMB_SIZE, flexShrink: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {opt.imageId !== null && opt.imageId !== undefined && (
            <ImageGraphic
              imageId={opt.imageId}
              maxWidth={THUMB_SIZE}
              maxHeight={THUMB_SIZE}
              autoCrop={true}
            />
          )}
        </div>
      )
    }
    return null
  }, [hasIcons, hasImageIds])

  // Virtual scroll: compute visible range
  const listHeight = 280  // max-height of scroll container
  const totalHeight = filteredOptions.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(
    filteredOptions.length - 1,
    Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + OVERSCAN
  )
  const visibleOptions = filteredOptions.slice(startIndex, endIndex + 1)
  const paddingTop = startIndex * ITEM_HEIGHT
  const paddingBottom = Math.max(0, (filteredOptions.length - endIndex - 1) * ITEM_HEIGHT)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      {/* Trigger */}
      <div
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen)
          if (!isOpen) { setSearchQuery(''); setScrollTop(0) }
        }}
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', padding: '0 8px', gap: '6px',
          overflow: 'hidden',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
          {displayLabel}
        </span>
        {onNavigate && (
          <button
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); onNavigate(value) }}
            title="선택한 항목으로 바로 이동합니다"
            style={{
              flexShrink: 0, marginLeft: '4px', padding: '2px 6px',
              fontSize: '11px', fontWeight: '600',
              backgroundColor: 'var(--ev-c-brand)', color: '#ffffff',
              border: 'none', borderRadius: '3px', cursor: disabled ? 'not-allowed' : 'pointer',
              lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'opacity 0.15s ease', opacity: disabled ? 0.5 : 0.85
            }}
            onMouseEnter={(e) => { if(!disabled) e.currentTarget.style.opacity = '1' }}
            onMouseLeave={(e) => { if(!disabled) e.currentTarget.style.opacity = '0.85' }}
          >
            <span>이동</span>
            <span style={{ fontSize: '10px' }}>➔</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          zIndex: 99999,
          backgroundColor: 'var(--color-background, #1e1e20)',
          border: '1px solid var(--ev-c-brand)', borderRadius: '4px',
          marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--ev-c-divider)' }}>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setScrollTop(0); if (listRef.current) listRef.current.scrollTop = 0 }}
              placeholder={placeholder}
              style={{
                width: '100%', padding: '6px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--ev-c-divider)',
                borderRadius: '4px', color: 'var(--ev-c-text-1)', outline: 'none'
              }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>

          {/* Virtual scroll list */}
          <div
            ref={listRef}
            style={{ height: `${listHeight}px`, overflowY: 'auto' }}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--ev-c-text-3)', fontSize: '13px' }}>검색 결과가 없습니다.</div>
            ) : (
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: paddingTop, left: 0, right: 0 }}>
                  {visibleOptions.map((opt) => {
                    const isSelected = opt.value === value
                    return (
                      <div
                        key={opt.value}
                        data-selected={isSelected ? 'true' : undefined}
                        onClick={() => { onChange(opt.value); setIsOpen(false) }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected
                            ? 'rgba(100, 108, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected
                            ? 'rgba(100, 108, 255, 0.15)' : 'transparent'
                        }}
                        style={{
                          height: ITEM_HEIGHT,
                          padding: '3px 8px',
                          cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace',
                          color: isSelected ? 'var(--ev-c-brand)' : 'var(--ev-c-text-1)',
                          backgroundColor: isSelected ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--ev-c-brand)' : '3px solid transparent',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          transition: 'background-color 0.1s ease',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span style={{ width: '16px', flexShrink: 0, fontSize: '11px', textAlign: 'center', opacity: isSelected ? 1 : 0 }}>✓</span>
                        {renderThumb(opt)}
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {renderOption ? renderOption(opt) : opt.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
