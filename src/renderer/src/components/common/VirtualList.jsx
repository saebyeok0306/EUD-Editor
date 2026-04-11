import React, { useRef, useState, useEffect, useCallback } from 'react'

/**
 * VirtualList - High-performance virtualized list component
 *
 * Only renders items within the visible viewport + overscan buffer.
 * Drop-in replacement for a simple scrollable list with fixed-height items.
 *
 * @param {object[]} items          - Array of items to render
 * @param {number}   itemHeight     - Fixed height (px) of each item
 * @param {Function} renderItem     - (item, index) => ReactNode
 * @param {number}   [overscan=5]   - Extra items to render above/below viewport
 * @param {string}   [className]    - CSS class for the scroll container
 * @param {object}   [style]        - Inline style for the scroll container
 * @param {number}   [scrollToIndex] - Auto-scroll to this index when it changes
 */
export default function VirtualList({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  style = {},
  scrollToIndex = null,
}) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Scroll to target index
  useEffect(() => {
    if (scrollToIndex === null || scrollToIndex === undefined) return
    const el = containerRef.current
    if (!el) return
    const targetTop = scrollToIndex * itemHeight
    const targetBot = targetTop + itemHeight
    const curTop = el.scrollTop
    const curBot = curTop + el.clientHeight
    if (targetTop < curTop || targetBot > curBot) {
      el.scrollTop = Math.max(0, targetTop - el.clientHeight / 2 + itemHeight / 2)
    }
  }, [scrollToIndex, itemHeight])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ item: items[i], index: i })
  }

  const paddingTop = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflowY: 'auto', ...style }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: paddingTop, left: 0, right: 0 }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight, boxSizing: 'border-box', overflow: 'hidden' }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
