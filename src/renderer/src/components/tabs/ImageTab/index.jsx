import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getImagesData, getImagesTbl } from '../../../utils/datStore'
import ImageGraphic from '../../common/ImageGraphic'
import imagesNamesData from '../../../data/Images.txt?raw'
import iscriptJsonUrl from '../../../data/iscript_data.json?url'

function ImagePreview({ imageId, name, userDataPath }) {
  // const [hasError, setHasError] = useState(false)
  // const [loaded, setLoaded] = useState(false)

  // const previewUrl = userDataPath 
  //   ? `file://${userDataPath}/image_previews/${imageId}.webp`.replace(/\\/g, '/')
  //   : null

  // if (previewUrl && !hasError) {
  //   return (
  //     <img 
  //       src={previewUrl} 
  //       alt={name} 
  //       decoding="async"
  //       loading="lazy"
  //       onLoad={() => setLoaded(true)}
  //       onError={() => setHasError(true)}
  //       style={{ 
  //         maxWidth: '100%', 
  //         maxHeight: '100%', 
  //         objectFit: 'contain',
  //         imageRendering: 'pixelated',
  //         opacity: loaded ? 1 : 0,
  //         transition: 'opacity 0.2s ease-in-out'
  //       }} 
  //     />
  //   )
  // }

  return <ImageGraphic imageId={imageId} playerColor="Red" maxWidth={44} maxHeight={44} autoCrop={true} animate={false} />
}

const MemoizedListItem = React.memo(({ item, isActive, onClick, userDataPath }) => (
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
      <ImagePreview
        imageId={item.id}
        name={item.name}
        userDataPath={userDataPath}
      />
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


function ImageTab({ mapData, projectData, datReady }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [imageNames, setImageNames] = useState([])
  const [iscriptData, setIscriptData] = useState(null)
  const [selectedAnimation, setSelectedAnimation] = useState('Init')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [direction, setDirection] = useState(0)
  const [userDataPath, setUserDataPath] = useState(null)

  useEffect(() => {
    window.api.getUserDataPath().then(path => setUserDataPath(path))
  }, [])

  useEffect(() => {
    fetch(iscriptJsonUrl)
      .then(res => res.json())
      .then(data => setIscriptData(data))
      .catch(err => console.error('Failed to load iscript_data.json', err))
  }, [])

  useEffect(() => {
    let defaultAnim = 'Init'
    if (selectedItem !== null && iscriptData) {
      const imagesData = getImagesData()
      if (imagesData && imagesData[selectedItem]) {
        const iscriptId = imagesData[selectedItem]['Iscript ID'] & 0xFFFF
        const header = iscriptData.headers.find(h => h.is_id === iscriptId)
        if (header && header.entry_points && header.entry_points.hasOwnProperty('Walking') && header.entry_points['Walking'] !== null) {
          defaultAnim = 'Walking'
        }
      }
    }
    setSelectedAnimation(defaultAnim)
    setCurrentFrame(0)
    setDirection(0)
  }, [selectedItem, iscriptData])

  useEffect(() => {
    if (!datReady) return
    const imagesData = getImagesData()
    const imagesTbl = getImagesTbl()
    if (!imagesData || !imagesTbl) return

    const names = []
    const keys = Object.keys(imagesData)
    const predefinedNames = imagesNamesData.split(/\r?\n/)

    for (let i = 0; i < keys.length; i++) {
      const id = parseInt(keys[i], 10)
      let name = `Image ${id}`
      if (predefinedNames[id] && predefinedNames[id].trim() !== '') {
        name = predefinedNames[id].trim()
      } else {
        const tblIndex = imagesData[id]['GRP File'] - 1
        if (imagesTbl[tblIndex]) {
          name = imagesTbl[tblIndex].split('\\').pop().split('/').pop()
        }
      }
      names.push({ id, name })
    }
    setImageNames(names)
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
  const currentImagesData = getImagesData()
  const currentItemData = (currentImagesData && selectedItem !== null) ? currentImagesData[selectedItem] : null

  const iscriptId = currentItemData ? (currentItemData['Iscript ID'] & 0xFFFF) : null
  const header = iscriptData?.headers.find(h => h.is_id === iscriptId)
  const availableAnimations = header?.entry_points ? Object.keys(header.entry_points) : []

  const handleItemClick = useCallback((id) => {
    setSelectedItem(id)
  }, [])

  const renderedList = useMemo(() => (
    <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}>
      {imageNames.map((item) => (
        <MemoizedListItem
          key={item.id}
          item={item}
          isActive={selectedItem === item.id}
          onClick={handleItemClick}
          userDataPath={userDataPath}
        />
      ))}
    </div>
  ), [imageNames, selectedItem, listWidth, userDataPath])

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
                <ImageGraphic
                  imageId={selectedItem}
                  tileset={currentMapTileset}
                  animate={true}
                  animationName={selectedAnimation}
                  direction={direction}
                  onFrameChange={setCurrentFrame}
                  maxWidth={128}
                  maxHeight={128}
                  autoCrop={false}
                  playerColor="Red"
                />
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--ev-c-text-1)', fontSize: '18px' }}>
                  {imageNames.find(i => i.id === selectedItem)?.name || `Image ${selectedItem}`}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '4px' }}>
                  ID: {selectedItem}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', marginBottom: '6px' }}>
                  Current Frame: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{currentFrame}</span>
                </div>
                {!!currentItemData?.['Gfx Turns'] && (
                  <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Direction:
                    <input
                      type="range"
                      min="0" max="31"
                      value={direction}
                      onChange={(e) => setDirection(parseInt(e.target.value, 10))}
                      style={{ width: '80px', margin: 0, height: '4px', cursor: 'pointer' }}
                    />
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', width: '16px' }}>{direction}</span>
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

              {/* Animations Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '600', color: 'var(--ev-c-text-1)', marginBottom: '10px' }}>
                  Animations <span style={{ fontSize: '11px', color: 'var(--ev-c-text-3)', fontWeight: 'normal' }}>(Iscript ID: {iscriptId})</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableAnimations.length > 0 ? availableAnimations.map(anim => (
                    <button
                      key={anim}
                      onClick={() => setSelectedAnimation(anim)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: selectedAnimation === anim ? '1px solid var(--ev-c-brand)' : '1px solid var(--ev-c-divider)',
                        backgroundColor: selectedAnimation === anim ? 'rgba(0, 119, 255, 0.1)' : 'var(--ev-c-bg-mute)',
                        color: selectedAnimation === anim ? 'var(--ev-c-brand)' : 'var(--ev-c-text-2)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {anim}
                    </button>
                  )) : (
                    <div style={{ color: 'var(--ev-c-text-3)', fontSize: '12px' }}>No animations found</div>
                  )}
                </div>
              </div>

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
            <div className="properties-empty-icon">🖼️</div>
            <div className="properties-empty-text">{t('unit.empty.text', { defaultValue: 'Select an image from the list' })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageTab
