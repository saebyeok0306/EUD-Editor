import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getSpritesData, getImagesData } from '../../../utils/datStore'
import ImageGraphic from '../../common/ImageGraphic'
import useNavigationTarget from '../../../hooks/useNavigationTarget'
import ListPane from '../../common/ListPane'

function SpritePreview({ spriteId }) {
  const spritesData = getSpritesData()
  const imageId = spritesData?.[spriteId]?.['Image File']

  if (imageId === undefined || imageId === null) {
    return <div style={{ width: 44, height: 44 }} />
  }

  return <ImageGraphic imageId={imageId} maxWidth={44} maxHeight={44} autoCrop={true} animate={false} />
}

const MemoizedListItem = React.memo(({ item, isActive, onClick }) => (
  <div
    className={`list-item${isActive ? ' active' : ''}`}
    onClick={() => onClick(item.id)}
    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '10px' }}
  >
    <div style={{ 
      width: '44px', 
      height: '44px', 
      flexShrink: 0, 
      backgroundColor: 'var(--ev-c-graphic-bg)', 
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--ev-c-divider)'
    }}>
      <SpritePreview spriteId={item.id} />
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ev-c-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl', textAlign: 'left' }}>
        <bdi>{item.name}</bdi>
      </div>
      <div className="list-item-id" style={{ fontSize: '10px', color: 'var(--ev-c-text-3)', marginTop: '2px' }}>
        ID: {item.id.toString().padStart(3, '0')}
      </div>
    </div>
  </div>
))

function SpriteTab({ mapData, datReady }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [spriteNames, setSpriteNames] = useState([])

  useNavigationTarget('Sprite', setSelectedItem)
  
  useEffect(() => {
    if (!datReady) return
    const spritesData = getSpritesData()
    if (!spritesData) return

    const names = []
    const keys = Object.keys(spritesData)

    for (let i = 0; i < keys.length; i++) {
      const id = parseInt(keys[i], 10)
      names.push({ id, name: `Sprite ${id}` })
    }
    setSpriteNames(names)
  }, [datReady])

  const currentMapTileset = mapData?.tileset || 'badlands'
  
  const currentSpritesData = getSpritesData()
  const currentItemData = (currentSpritesData && selectedItem !== null) ? currentSpritesData[selectedItem] : null
  const imageId = currentItemData?.['Image File']

  return (
    <div className="content-body">
      <ListPane
        items={spriteNames}
        selectedItem={selectedItem}
        renderItem={(item) => (
          <MemoizedListItem
            key={item.id}
            item={item}
            isActive={selectedItem === item.id}
            onClick={setSelectedItem}
          />
        )}
      />

      {/* Right Pane: Properties */}
      <div className="properties-pane">
        {selectedItem !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--ev-c-divider)', paddingBottom: '15px', marginBottom: '15px' }}>
              <div style={{ 
                width: '128px', 
                height: '128px', 
                backgroundColor: 'var(--ev-c-graphic-bg)', 
                border: '1px solid var(--ev-c-divider)',
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: '20px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {imageId !== undefined && imageId !== null ? (
                  <ImageGraphic 
                    imageId={imageId} 
                    tileset={currentMapTileset} 
                    animate={true} 
                    animationName="Init"
                    maxWidth={128} 
                    maxHeight={128} 
                    autoCrop={false} 

                  />
                ) : (
                  <div style={{ color: 'var(--ev-c-text-3)', fontSize: '12px' }}>No Image</div>
                )}
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--ev-c-text-1)', fontSize: '18px' }}>
                  {spriteNames.find(i => i.id === selectedItem)?.name || `Sprite ${selectedItem}`}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '4px' }}>
                  ID: {selectedItem}
                </div>
                {imageId !== undefined && (
                  <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '6px' }}>
                    Image ID: {imageId}
                  </div>
                )}
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="sub-tabs">
              <div className="sub-tab-item active">
                Basic Info
              </div>
            </div>

            {/* Properties Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', paddingTop: '15px' }}>
              
              <div style={{ fontWeight: '600', color: 'var(--ev-c-text-1)', marginBottom: '10px' }}>Data Properties</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '8px 15px', fontSize: '13px' }}>
                {Object.keys(currentItemData || {}).map(k => (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ color: 'var(--ev-c-text-2)', padding: '6px 0', borderBottom: '1px solid var(--ev-c-divider-light)' }}>
                      {k}
                    </div>
                    <div style={{ color: 'var(--ev-c-text-1)', padding: '6px 0', borderBottom: '1px solid var(--ev-c-divider-light)', fontWeight: '500' }}>
                      {currentItemData[k]}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        ) : (
          <div className="properties-empty">
            <div className="properties-empty-icon">⚙️</div>
            <div className="properties-empty-text">{t('unit.empty.text', { defaultValue: 'Select a sprite from the list' })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpriteTab
