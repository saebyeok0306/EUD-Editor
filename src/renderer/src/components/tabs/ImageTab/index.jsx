import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getImagesData, getImagesTbl } from '../../../utils/datStore'
import ImageGraphic from '../../common/ImageGraphic'
import imagesNamesData from '../../../data/Images.txt?raw'
import iscriptJsonUrl from '../../../data/iscript_data.json?url'
import SearchableSelect from '../../common/SearchableSelect'
import '../../common/TabCommon.css'
import useNavigationTarget from '../../../hooks/useNavigationTarget'

import GraphicRenderer from './GraphicRenderer'
import { MemoizedListItem } from './ImageListItem'
import { Field, Card } from './ImageFormUI'


function ImageTab({ mapData, projectData, datReady, onUpdateProjectImage }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [imageNames, setImageNames] = useState([])
  const [iscriptData, setIscriptData] = useState(null)
  const [selectedAnimation, setSelectedAnimation] = useState('Init')
  const [userDataPath, setUserDataPath] = useState(null)

  useNavigationTarget('Image', setSelectedItem)

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
        // const header = iscriptData.headers.find(h => h.is_id === iscriptId)
        // if (header && header.entry_points && header.entry_points.hasOwnProperty('Walking') && header.entry_points['Walking'] !== null) {
        //   defaultAnim = 'Walking'
        // }
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

  const drawOptions = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      value: i, label: `[${i}] ${t(`image.draw.${i}`)}`
    }))
  }, [t])

  const iscriptOptions = useMemo(() => {
    if (!iscriptData) return []
    return iscriptData.headers.map(h => {
      let name = h.entry_points.Init || h.entry_points.Walking || `IScript ${h.is_id}`
      if (typeof name === 'string' && name.endsWith('Init')) name = name.replace(/Init$/, '')
      return { value: h.is_id, label: `[${h.is_id.toString().padStart(3, '0')}] ${name}` }
    })
  }, [iscriptData])

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
          <div className="tab-detail-container" style={{ height: '100%', overflowY: 'auto' }}>



            <div className="tab-detail-grid">
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
                    <Field label={t('image.prop.drawFunction', { defaultValue: '기능 (Draw)' })} type="select" options={drawOptions} value={currentItemData?.['Draw Function']} onChange={(v) => handleUpdate('Draw Function', v)} />
                    <Field label={t('image.prop.remapping', { defaultValue: '색상표 (Remap)' })} type="select" value={currentItemData?.['Remapping']} onChange={(v) => handleUpdate('Remapping', v)} />
                  </div>
                </Card>

                <Card title="스크립트 정보">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Field
                      label="IScript ID"
                      type="searchable"
                      options={iscriptOptions}
                      value={currentItemData?.['Iscript ID'] & 0xFFFF}
                      onChange={(v) => handleUpdate('Iscript ID', v)}
                    />
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
