import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getWeaponsData, getFlingyData, getSpritesData, getStatTxtKorEng } from '../../../utils/datStore'
import ImageGraphic from '../../common/ImageGraphic'
import DatIcon from '../../common/DatIcon'
import useNavigationTarget from '../../../hooks/useNavigationTarget'

function WeaponPreview({ weaponId }) {
  const weaponsData = getWeaponsData()
  const flingyData = getFlingyData()
  const spritesData = getSpritesData()
  
  const flingyId = weaponsData?.[weaponId]?.['Graphics']
  const spriteId = flingyData?.[flingyId]?.['Sprite']
  const imageId = spritesData?.[spriteId]?.['Image File']

  if (imageId === undefined || imageId === null) {
    return <div style={{ width: 44, height: 44 }} />
  }

  return <ImageGraphic imageId={imageId} playerColor="Red" maxWidth={44} maxHeight={44} autoCrop={true} animate={false} />
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
      backgroundColor: 'var(--ev-c-bg-mute)', 
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--ev-c-divider)'
    }}>
      <DatIcon frameIndex={item.icon} size={44} style={{ border: 'none', backgroundColor: 'transparent' }} />
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

function WeaponTab({ mapData, datReady }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [weaponNames, setWeaponNames] = useState([])

  useNavigationTarget('Weapon', setSelectedItem)
  
  useEffect(() => {
    if (!datReady) return
    const weaponsData = getWeaponsData()
    const statTxt = getStatTxtKorEng() // Or getStatTxt() depending on preference
    if (!weaponsData || !statTxt) return

    const names = []
    const keys = Object.keys(weaponsData)

    for (let i = 0; i < keys.length; i++) {
      const id = parseInt(keys[i], 10)
      const labelIdx = weaponsData[id]['Label']
      let name = `Weapon ${id}`
      
      if (labelIdx > 0 && statTxt[labelIdx - 1]) {
        name = statTxt[labelIdx - 1]
      }
      
      const iconIdx = weaponsData[id]['Icon']
      names.push({ id, name, icon: iconIdx })
    }
    setWeaponNames(names)
  }, [datReady])

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

  const currentMapTileset = mapData?.tileset || 'badlands'
  
  const currentWeaponsData = getWeaponsData()
  const currentFlingyData = getFlingyData()
  const currentSpritesData = getSpritesData()
  
  const currentItemData = (currentWeaponsData && selectedItem !== null) ? currentWeaponsData[selectedItem] : null
  const iconIdx = currentItemData?.['Icon']
  const flingyId = currentItemData?.['Graphics']
  const spriteId = currentFlingyData?.[flingyId]?.['Sprite']
  const imageId = currentSpritesData?.[spriteId]?.['Image File']

  const handleItemClick = useCallback((id) => {
    setSelectedItem(id)
  }, [])

  const renderedList = useMemo(() => (
    <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}>
      {weaponNames.map((item) => (
        <MemoizedListItem
          key={item.id}
          item={item}
          isActive={selectedItem === item.id}
          onClick={handleItemClick}
        />
      ))}
    </div>
  ), [weaponNames, selectedItem, listWidth])

  return (
    <div className="content-body">
      {/* Left Pane: Items List */}
      {renderedList}

      {/* Resizer */}
      <div
        className={`resizer${isDragging ? ' dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
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
                backgroundColor: 'var(--ev-c-bg-mute)', 
                border: '1px solid var(--ev-c-divider)',
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: '20px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {iconIdx !== undefined && iconIdx !== null ? (
                  <DatIcon 
                    frameIndex={iconIdx} 
                    size={128} 
                    style={{ border: 'none', backgroundColor: 'transparent' }}
                  />
                ) : (
                  <div style={{ color: 'var(--ev-c-text-3)', fontSize: '12px' }}>No Icon</div>
                )}
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--ev-c-text-1)', fontSize: '18px' }}>
                  {weaponNames.find(i => i.id === selectedItem)?.name || `Weapon ${selectedItem}`}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '4px' }}>
                  ID: {selectedItem}
                </div>
                {flingyId !== undefined && (
                  <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '4px' }}>
                    Graphics (Flingy): {flingyId}
                  </div>
                )}
                {spriteId !== undefined && (
                  <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '4px' }}>
                    Sprite ID: {spriteId}
                  </div>
                )}
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
            <div className="properties-empty-text">{t('unit.empty.text', { defaultValue: 'Select a weapon from the list' })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeaponTab
