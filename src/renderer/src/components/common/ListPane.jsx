import React, { useState, useMemo, useEffect } from 'react'
import { useI18n } from '../../i18n/i18nContext'
import VirtualList from './VirtualList'
import './TabCommon.css'

let globalListWidth = parseInt(localStorage.getItem('ev-list-pane-width') || '265', 10)

function ListPane({
  items,
  selectedItem,
  onSelect,
  renderItem,
  useVirtualList = true,
  itemHeight = 60,
  leftOffset = 250,
  searchKey = 'name'
}) {
  const { t } = useI18n()
  const [listWidth, setListWidth] = useState(globalListWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState('id')

  const widthRef = React.useRef(listWidth)

  useEffect(() => {
    widthRef.current = listWidth
  }, [listWidth])

  useEffect(() => {
    // In case width was modified by another previously unmounted tab
    setListWidth(globalListWidth)

    // Listen for resize events from other ListPane instances
    const syncResize = (e) => {
      if (e.detail) {
        setListWidth(e.detail)
      }
    }
    window.addEventListener('list-pane-resize', syncResize)
    return () => window.removeEventListener('list-pane-resize', syncResize)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const newWidth = e.clientX - leftOffset
      const clamped = Math.max(200, Math.min(newWidth, window.innerWidth * 0.6))
      widthRef.current = clamped
      setListWidth(clamped)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = 'default'
      const finalWidth = widthRef.current
      globalListWidth = finalWidth
      localStorage.setItem('ev-list-pane-width', finalWidth.toString())
      window.dispatchEvent(new CustomEvent('list-pane-resize', { detail: finalWidth }))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isDragging, leftOffset])

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = items.filter(item => {
        const text = item[searchKey] || ''
        const idStr = item.id !== undefined ? item.id.toString() : (item.i !== undefined ? item.i.toString() : '')
        return text.toLowerCase().includes(q) || idStr.includes(q)
      });
    }

    result = [...result].sort((a, b) => {
      if (sortType === 'id') {
        const idA = a.id !== undefined ? a.id : a.i
        const idB = b.id !== undefined ? b.id : b.i
        return idA - idB
      } else {
        const textA = a[searchKey] || ''
        const textB = b[searchKey] || ''
        return textA.localeCompare(textB)
      }
    })

    return result;
  }, [items, searchQuery, searchKey, sortType]);

  return (
    <>
      <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ev-c-divider)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--ev-c-black-mute)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '6px',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--ev-c-brand)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--ev-c-divider)'}
          >
            <input
              type="text"
              placeholder={t('common.search', { defaultValue: '검색...' })}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                padding: '6px 10px',
                color: 'var(--ev-c-text-1)',
                fontSize: '13px',
                minWidth: 0,
              }}
            />
            {searchQuery && (
              <span
                onClick={() => setSearchQuery('')}
                title={t('common.clear', { defaultValue: '지우기' })}
                style={{
                  flexShrink: 0,
                  color: 'var(--ev-c-text-3)',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  fontSize: '14px',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ev-c-text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ev-c-text-3)'}
              >
                ✕
              </span>
            )}
          </div>

          <div style={{ display: 'flex', background: 'var(--ev-c-bg-soft)', borderRadius: '4px', padding: '2px', border: '1px solid var(--ev-c-divider)' }}>
            <button
              onClick={() => setSortType('id')}
              style={{
                flex: 1,
                background: sortType === 'id' ? 'var(--ev-c-brand)' : 'transparent',
                color: sortType === 'id' ? 'white' : 'var(--ev-c-text-2)',
                border: 'none',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t('common.sortId', { defaultValue: 'ID 순' })}
            </button>
            <button
              onClick={() => setSortType('name')}
              style={{
                flex: 1,
                background: sortType === 'name' ? 'var(--ev-c-brand)' : 'transparent',
                color: sortType === 'name' ? 'white' : 'var(--ev-c-text-2)',
                border: 'none',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t('common.sortName', { defaultValue: '이름 순' })}
            </button>
          </div>
        </div>
        <div className={useVirtualList ? "" : "list-pane-scroll"} style={{ flex: 1, overflowY: 'auto' }}>
          {useVirtualList ? (
            <VirtualList
              className="list-pane-scroll"
              items={filteredItems}
              itemHeight={itemHeight}
              scrollToIndex={selectedItem !== null ? filteredItems.findIndex(n => (n.id ?? n.i) === selectedItem) : null}
              style={{ height: '100%' }}
              renderItem={(item) => renderItem(item)}
            />
          ) : (
            filteredItems.map(item => renderItem(item))
          )}
        </div>
      </div>

      {/* Resizer */}
      <div
        className={`resizer${isDragging ? ' dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
      />
    </>
  )
}

export default ListPane
