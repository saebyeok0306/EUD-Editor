import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getImagesData, getImagesTbl } from '../../../utils/datStore'
import ImageGraphic from '../../common/ImageGraphic'
import imagesNamesData from '../../../data/Images.txt?raw'
import iscriptJsonUrl from '../../../data/iscript_data.json?url'
import '../UnitTab/UnitTab.css'

function Field({ label, value, onChange, type = "number", className = "" }) {
  return (
    <div className={`field-group ${className}`}>
      <label className="field-label" style={{ minWidth: '100px', flexShrink: 0 }}>{label}</label>
      <div className="value-row">
        {type === 'select' ? (
           <select className="modern-input" value={value ?? 0} onChange={(e) => onChange(parseInt(e.target.value))}>
             <option value={value ?? 0}>{value ?? 0}</option>
           </select>
        ) : (
          <input
            type={type}
            className="modern-input"
            value={value ?? ''}
            onChange={(e) => onChange(type === "number" ? (parseInt(e.target.value) || 0) : e.target.value)}
          />
        )}
      </div>
    </div>
  )
}

function Card({ title, children, style }) {
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

const GraphicRenderer = React.memo(({ imageId, tileset, selectedAnimation, autoCrop, customData }) => {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [direction, setDirection] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const [restartKey, setRestartKey] = useState(0)
  const graphicRef = useRef(null)

  const handleReplay = useCallback(() => {
    setRestartKey(k => k + 1)
    if (!isPlaying) setIsPlaying(true)
  }, [isPlaying])

  const handleStep = useCallback((delta) => {
    if (isPlaying) setIsPlaying(false)
    if (graphicRef.current) graphicRef.current.stepFrame(delta)
  }, [isPlaying])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--ev-c-divider)' }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)', backgroundImage: 'radial-gradient(var(--ev-c-divider) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '10px 10px', minHeight: '200px', padding: '20px' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => handleStep(-1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="이전 프레임 (-1)"
            >
              ⏮
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button 
              onClick={() => handleStep(1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="다음 프레임 (+1)"
            >
              ⏭
            </button>
            <button 
              onClick={handleReplay}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="처음부터 다시 재생"
            >
              🔄
            </button>
          </div>

          <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', fontSize: '11px', padding: '4px', cursor: 'pointer', outline: 'none' }}>
            <option value={0.01}>0.01x</option>
            <option value={0.05}>0.05x</option>
            <option value={0.1}>0.1x</option>
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x (기본)</option>
          </select>

          <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--ev-c-divider)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: 'var(--ev-c-text-2)', fontSize: '11px' }}>FRAME</span>
            <span style={{ color: 'var(--ev-c-brand)', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>{currentFrame.toString().padStart(4, '0')}</span>
          </div>
        </div>
        <ImageGraphic
          ref={graphicRef}
          imageId={imageId}
          tileset={tileset}
          animate={true}
          animationName={selectedAnimation}
          direction={direction}
          onFrameChange={setCurrentFrame}
          maxWidth={300}
          maxHeight={300}
          autoCrop={autoCrop}
          playerColor="Red"
          customData={customData}
          playbackSpeed={playbackSpeed}
          paused={!isPlaying}
          onAnimationEnd={() => setIsPlaying(false)}
          restartKey={restartKey}
        />
      </div>
      {autoCrop && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--ev-c-bg)', borderTop: '1px solid var(--ev-c-divider)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: 'var(--ev-c-text-2)', fontSize: '13px' }}>방향:</span>
          <input type="range" min="0" max="31" value={direction} onChange={(e) => setDirection(parseInt(e.target.value, 10))} style={{ flex: 1, margin: 0, accentColor: 'var(--ev-c-brand)', cursor: 'pointer' }} />
          <span style={{ color: 'var(--ev-c-text-1)', fontFamily: 'monospace', fontSize: '14px', width: '20px', textAlign: 'right' }}>{direction}</span>
        </div>
      )}
    </div>
  )
})

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


function ImageTab({ mapData, projectData, datReady, onUpdateProjectImage }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [imageNames, setImageNames] = useState([])
  const [iscriptData, setIscriptData] = useState(null)
  const [selectedAnimation, setSelectedAnimation] = useState('Init')
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
  const baseItemData = (currentImagesData && selectedItem !== null) ? currentImagesData[selectedItem] : null
  const currentItemData = useMemo(() => {
    if (!baseItemData) return null
    return { ...baseItemData, ...(projectData?.images?.[selectedItem] || {}) }
  }, [baseItemData, projectData, selectedItem])

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

  const handleUpdate = useCallback((key, value) => {
    if (onUpdateProjectImage) {
      onUpdateProjectImage('images', selectedItem, key, value)
    }
  }, [onUpdateProjectImage, selectedItem])

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
          <div className="unit-detail-container" style={{ height: '100%', overflowY: 'auto' }}>
            


            <div className="unit-detail-grid">
              {/* Image Preview & Controls (Left column) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <GraphicRenderer
                  key={`${selectedItem}-${selectedAnimation}`}
                  imageId={selectedItem}
                  tileset={currentMapTileset}
                  selectedAnimation={selectedAnimation}
                  autoCrop={!!currentItemData?.['Gfx Turns']}
                  customData={currentItemData}
                />
                
                <Card title="이미지 스크립트 (애니메이션)">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }} className="custom-scrollbar">
                    {availableAnimations.length > 0 ? availableAnimations.map((anim, idx) => {
                       const isSelected = selectedAnimation === anim;
                       return (
                         <div
                           key={anim}
                           onClick={() => setSelectedAnimation(anim)}
                           style={{
                             padding: '10px 12px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer',
                             backgroundColor: isSelected ? 'var(--ev-c-brand)' : 'var(--ev-c-bg-mute)',
                             color: isSelected ? 'white' : 'var(--ev-c-text-1)',
                             display: 'flex', alignItems: 'center', gap: '10px',
                             fontWeight: isSelected ? 'bold' : 'normal',
                             transition: 'all 0.15s'
                           }}
                         >
                           <span style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--ev-c-text-3)', fontSize: '11px', minWidth: '20px' }}>{String(idx).padStart(2, '0')}</span>
                           {anim}
                         </div>
                       )
                    }) : (
                       <div style={{ padding: '10px', color: 'var(--ev-c-text-3)', fontSize: '12px', textAlign: 'center' }}>데이터 없음</div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Data Properties (Right column) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Card title="일반 정보">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {['Gfx Turns', 'Clickable', 'Use Full Iscript', 'Draw If Cloaked'].map(key => (
                      <label key={key} className="checkbox-label" style={{ padding: '8px 12px', backgroundColor: 'var(--ev-c-bg-mute)', borderRadius: '6px' }}>
                        <input
                          type="checkbox"
                          checked={!!currentItemData?.[key]}
                          onChange={(e) => handleUpdate(key, e.target.checked ? 1 : 0)}
                        />
                        {key === 'Gfx Turns' ? '그래픽 회전' : key === 'Clickable' ? '클릭 가능' : key === 'Use Full Iscript' ? '모든 스크립트' : key === 'Draw If Cloaked' ? '클로킹시 표시' : key}
                      </label>
                    ))}
                  </div>
                </Card>

                <Card title="화면 출력 정보">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Field label="기능 (Draw)" type="select" value={currentItemData?.['Draw Function']} onChange={(v) => handleUpdate('Draw Function', v)} />
                    <Field label="색상표 (Remap)" type="select" value={currentItemData?.['Remapping']} onChange={(v) => handleUpdate('Remapping', v)} />
                  </div>
                </Card>

                <Card title="추가 데이터">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Field label="IScript ID" type="number" value={currentItemData?.['Iscript ID']} onChange={(v) => handleUpdate('Iscript ID', v)} />
                    <Field label="GRP File" type="number" value={currentItemData?.['GRP File']} onChange={(v) => handleUpdate('GRP File', v)} />
                    {Object.keys(currentItemData || {}).filter(k => !['Gfx Turns', 'Clickable', 'Use Full Iscript', 'Draw If Cloaked', 'Draw Function', 'Remapping', 'Iscript ID', 'GRP File'].includes(k)).map(k => (
                      <Field key={k} label={k} type="number" value={currentItemData[k]} onChange={(v) => handleUpdate(k, v)} />
                    ))}
                  </div>
                </Card>
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
