import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/i18nContext'

function GenericTab({ category, mapData }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e) => {
      const newWidth = e.clientX - 250
      setListWidth(Math.max(200, Math.min(newWidth, window.innerWidth * 0.6)))
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = 'default'
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isDragging])

  const categoryLabel = t(`category.${category}`)

  return (
    <div className="content-body">
      <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={`list-item${selectedItem === i ? ' active' : ''}`}
            onClick={() => setSelectedItem(i)}
          >
            <span className="list-item-id">{i.toString().padStart(3, '0')}</span>
            <span className="list-item-name">{categoryLabel} {i}</span>
          </div>
        ))}
      </div>

      <div
        className={`resizer${isDragging ? ' dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
      />

      <div className="properties-pane">
        {selectedItem !== null ? (
          <div>
            <h3 className="properties-title">{categoryLabel} {selectedItem.toString().padStart(3, '0')}</h3>
            <p>{t('generic.prop.placeholder', { category: categoryLabel })}</p>
          </div>
        ) : (
          <div className="properties-empty">
            <div className="properties-empty-icon">⚙️</div>
            <div className="properties-empty-text">{t('generic.empty.text', { category: categoryLabel })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenericTab
