import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/i18nContext'

import { 
  getFlingyData, 
  getSpritesData, 
  getWeaponsData, 
  getImagesData, 
  getUpgradesData, 
  getTechdataData, 
  getOrdersData 
} from '../../utils/datStore'

function GenericTab({ category, mapData }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)

  const dataGetters = {
    Flingy: getFlingyData,
    Sprite: getSpritesData,
    Weapon: getWeaponsData,
    Image: getImagesData,
    Upgrade: getUpgradesData,
    Tech: getTechdataData,
    Order: getOrdersData
  }

  const allData = dataGetters[category]?.() || []
  const currentEudData = selectedItem !== null ? allData[selectedItem] : null
  const itemCount = allData.length || 50

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
        {Array.from({ length: itemCount }).map((_, i) => (
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
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              <h3 className="properties-title">{categoryLabel} {selectedItem.toString().padStart(3, '0')}</h3>
              <p>{t('generic.prop.placeholder', { category: categoryLabel })}</p>

              {/* [DEBUG] 임시 데이터 키값 확인용 (개발 완료 후 삭제 필요) */}
              <div style={{ 
                marginTop: '40px', 
                margin: '20px',
                padding: '15px', 
                border: '1px dashed var(--ev-c-divider)', 
                borderRadius: '8px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                fontSize: '11px', 
                color: 'var(--ev-c-text-3)' 
              }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                   🛠 [DEBUG] Available DAT Keys ({category}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.keys(currentEudData || {}).map(k => (
                    <span key={k} style={{ 
                      background: 'var(--ev-c-bg-mute)', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      border: '1px solid var(--ev-c-divider)'
                    }}>
                      {k}
                    </span>
                  ))}
                  {(!currentEudData || Object.keys(currentEudData).length === 0) && (
                    <span>No data available for this item.</span>
                  )}
                </div>
              </div>
            </div>
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
