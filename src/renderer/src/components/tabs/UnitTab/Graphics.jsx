import { useMemo, useCallback } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import UnitGraphic from '../../common/UnitGraphic'
import ImageGraphic from '../../common/ImageGraphic'
import SearchableSelect from '../../common/SearchableSelect'
import { getFlingyData, getSpritesData } from '../../../utils/datStore'
import useDatOptions from '../../../hooks/useDatOptions'
import { useNavigation } from '../../../contexts/NavigationContext'
import '../../common/TabCommon.css'

function Field({ label, value, onChange, modified, addon, type = "number", className = "", style, selectOptions, disabled }) {
  return (
    <div className={`field-group ${className}`} style={style}>
      <label className="field-label">{label}</label>
      <div className="value-row">
        {selectOptions ? (
          <select
            className={`modern-input ${modified ? 'modified' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            disabled={disabled}
          >
            {selectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            className={`modern-input ${modified ? 'modified' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(type === "number" ? (parseInt(e.target.value) || 0) : e.target.value)}
            disabled={disabled}
          />
        )}
        {addon && <span className="addon-text">{addon}</span>}
      </div>
    </div>
  )
}

function Card({ title, children, style }) {
  return (
    <div className="info-card" style={style}>
      {title && (
        <div className="card-header">
          <span className="card-title">{title}</span>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

function DatSelectRow({ label, value, onChange, options, imageId, onNavigate }) {
  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="field-label" style={{ width: '60px', flexShrink: 0 }}>{label}</div>
      <input
        type="number"
        className="modern-input"
        style={{ width: '56px', flex: 'none' }}
        value={value ?? 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
      {imageId !== undefined && (
        <div className="small-graphic-box" style={{ backgroundColor: 'var(--ev-c-graphic-bg)' }}>
          {imageId !== null ? (
            <ImageGraphic imageId={imageId} maxWidth={28} maxHeight={28} autoCrop={true} />
          ) : null}
        </div>
      )}
      <SearchableSelect
        className="modern-input"
        options={options}
        value={value ?? 0}
        onChange={onChange}
        onNavigate={onNavigate}
        style={{ flex: 1, height: '30px', backgroundColor: 'rgba(255,255,255,0.05)' }}
      />
    </div>
  )
}

function GraphicsTab({ selectedItem, currentProjectData, currentMapData, currentEudData, onUpdateProjectUnit, onResetProjectUnit }) {
  const { t } = useI18n()
  const { navigateTo } = useNavigation()

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    return currentEudData?.[eudField] ?? 0
  }

  const ELEVATION_OPTIONS = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      value: i,
      label: `${i} ${i <= 1 ? t('unit.elevation.floor') : i <= 11 ? t('unit.elevation.ground') : t('unit.elevation.air')}`
    }))
  }, [t])

  const DIRECTION_OPTIONS = useMemo(() => {
    return Array.from({ length: 33 }, (_, i) => {
      let key = ''
      if (i === 0) key = 'unit.dir.top'
      else if (i >= 1 && i <= 7) key = 'unit.dir.topRight'
      else if (i === 8) key = 'unit.dir.right'
      else if (i >= 9 && i <= 15) key = 'unit.dir.bottomRight'
      else if (i === 16) key = 'unit.dir.bottom'
      else if (i >= 17 && i <= 23) key = 'unit.dir.bottomLeft'
      else if (i === 24) key = 'unit.dir.left'
      else if (i >= 25 && i <= 31) key = 'unit.dir.topLeft'
      else if (i === 32) key = 'unit.dir.random'

      return { value: i, label: `${i} ${t(key)}` }
    })
  }, [t])

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // DAT option lists
  const flingyOptions = useDatOptions('flingy')
  const imageOptions = useDatOptions('image')
  const portraitOptions = useDatOptions('portrait')

  // Fields mapping
  const flingy = getVal('graphics', 'Graphics')
  const macr = getVal('constructionAnimation', 'Construction Animation')
  const portrait = getVal('portrait', 'Portrait')
  const elevation = getVal('elevationLevel', 'Elevation Level')
  const direction = getVal('unitDirection', 'Unit Direction')

  const dimLeft = getVal('unitSizeLeft', 'Unit Size Left')
  const dimRight = getVal('unitSizeRight', 'Unit Size Right')
  const dimUp = getVal('unitSizeUp', 'Unit Size Up')
  const dimDown = getVal('unitSizeDown', 'Unit Size Down')

  const boxWidth = getVal('starEditPlacementBoxWidth', 'StarEdit Placement Box Width')
  const boxHeight = getVal('starEditPlacementBoxHeight', 'StarEdit Placement Box Height')

  const addonX = getVal('addonHorizontalPosition', 'Addon Horizontal (X) Position')
  const addonY = getVal('addonVerticalPosition', 'Addon Vertical (Y) Position')

  // Resolve Graphics to Image ID for preview
  const flingyData = getFlingyData()
  const spritesData = getSpritesData()

  const flingyImageId = useMemo(() => {
    if (!flingyData || !spritesData || !flingyData[flingy]) return null;
    const spriteId = flingyData[flingy]['Sprite']
    if (spriteId === undefined || !spritesData[spriteId]) return null;
    return spritesData[spriteId]['Image File'];
  }, [flingy, flingyData, spritesData])

  if (selectedItem === null) return null

  return (
    <div className="tab-detail-container">
      {/* 1. 그래픽 정보 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="section-label">그래픽 정보</div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DatSelectRow
              label="비행정보"
              value={flingy}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'graphics', v)}
              options={flingyOptions}
              imageId={flingyImageId}
              onNavigate={(v) => navigateTo('Flingy', v)}
            />
            <DatSelectRow
              label="생산모습"
              value={macr}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'constructionAnimation', v)}
              options={imageOptions}
              imageId={macr}
              onNavigate={(v) => navigateTo('Image', v)}
            />
            <DatSelectRow
              label="얼굴모습"
              value={portrait}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'portrait', v)}
              options={portraitOptions}
            />

            {/* Elevation & Direction */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              <div className="field-group" style={{ gridTemplateColumns: '40px 1fr', flex: 1 }}>
                <label className="field-label">높이</label>
                <div className="value-row">
                  <SearchableSelect
                    className={`modern-input ${isMod('elevationLevel') ? 'modified' : ''}`}
                    options={ELEVATION_OPTIONS.find(o => o.value === elevation) ? ELEVATION_OPTIONS : [...ELEVATION_OPTIONS, { value: elevation, label: `${elevation} (Custom)` }]}
                    value={elevation}
                    onChange={(v) => onUpdateProjectUnit(selectedItem, 'elevationLevel', v)}
                    style={{ height: '30px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
              </div>
              <div className="field-group" style={{ gridTemplateColumns: '60px 1fr', flex: 1 }}>
                <label className="field-label">생산방향</label>
                <div className="value-row">
                  <SearchableSelect
                    className={`modern-input ${isMod('unitDirection') ? 'modified' : ''}`}
                    options={DIRECTION_OPTIONS.find(o => o.value === direction) ? DIRECTION_OPTIONS : [...DIRECTION_OPTIONS, { value: direction, label: `${direction} (Custom)` }]}
                    value={direction}
                    onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitDirection', v)}
                    style={{ height: '30px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Left Side: Dimensions */}
        <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 유닛 크기 */}
          <div className="section-label-sm">유닛 크기</div>
          <Card style={{ padding: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="좌" value={dimLeft} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitSizeLeft', v)} modified={isMod('unitSizeLeft')} style={{ gridTemplateColumns: '20px 1fr' }} />
              <Field label="우" value={dimRight} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitSizeRight', v)} modified={isMod('unitSizeRight')} style={{ gridTemplateColumns: '20px 1fr' }} />
              <Field label="상" value={dimUp} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitSizeUp', v)} modified={isMod('unitSizeUp')} style={{ gridTemplateColumns: '20px 1fr' }} />
              <Field label="하" value={dimDown} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitSizeDown', v)} modified={isMod('unitSizeDown')} style={{ gridTemplateColumns: '20px 1fr' }} />
            </div>
          </Card>

          {/* 건설 크기 */}
          <div className="section-label-sm" style={{ marginTop: '8px' }}>건설 크기</div>
          <Card style={{ padding: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="너비" value={boxWidth} onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditPlacementBoxWidth', v)} modified={isMod('starEditPlacementBoxWidth')} style={{ gridTemplateColumns: '30px 1fr' }} />
              <Field label="높이" value={boxHeight} onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditPlacementBoxHeight', v)} modified={isMod('starEditPlacementBoxHeight')} style={{ gridTemplateColumns: '30px 1fr' }} />
            </div>
          </Card>

          {/* 애드온 위치 */}
          <div className="section-label-sm" style={{ marginTop: '8px' }}>애드온 위치</div>
          <Card style={{ padding: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="가로" type="text" value={addonX} onChange={(v) => onUpdateProjectUnit(selectedItem, 'addonHorizontalPosition', v)} modified={isMod('addonHorizontalPosition')} style={{ gridTemplateColumns: '30px 1fr' }} disabled />
              <Field label="세로" type="text" value={addonY} onChange={(v) => onUpdateProjectUnit(selectedItem, 'addonVerticalPosition', v)} modified={isMod('addonVerticalPosition')} style={{ gridTemplateColumns: '30px 1fr' }} disabled />
            </div>
          </Card>
        </div>

        {/* Right Side: Preview Boxes */}
        <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
          {/* Main Visual */}
          <div className="preview-box" style={{ minHeight: '260px', overflow: 'hidden' }}>
            {/* Base 256x256 Graphic Bounds Indicator */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '256px',
              height: '256px',
              border: '1px solid var(--ev-c-divider)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              pointerEvents: 'none',
              zIndex: 1
            }}>
              {/* Origin Crosshairs */}
              <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            <UnitGraphic
              unitId={selectedItem}
              playerColor="Red"
              maxWidth={256}
              maxHeight={256}
              autoCrop={false}
              animate={true}
              style={{ zIndex: 2 }}
            />

            {/* Draw Placement Box representing Construction Size */}
            {boxWidth > 0 && boxHeight > 0 && (
              <div style={{
                position: 'absolute',
                left: `calc(50% - ${boxWidth / 2}px)`,
                top: `calc(50% - ${boxHeight / 2}px)`,
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
                backgroundColor: 'rgba(50, 150, 255, 0.25)', // Semi-transparent blue
                border: '1px dashed rgba(50, 150, 255, 0.6)',
                pointerEvents: 'none',
                zIndex: 9
              }} />
            )}

            {/* Draw Red Bounding Box representing Unit Size */}
            <div style={{
              position: 'absolute',
              left: `calc(50% - ${dimLeft}px)`,
              top: `calc(50% - ${dimUp}px)`,
              width: `${dimLeft + dimRight}px`,
              height: `${dimUp + dimDown}px`,
              border: '1px solid red',
              pointerEvents: 'none',
              zIndex: 10
            }} />
          </div>

          {/* Secondary Visual (Construction) */}
          <div className="preview-box" style={{ minHeight: '260px', overflow: 'hidden' }}>
            {/* Base 256x256 Graphic Bounds Indicator */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '256px',
              height: '256px',
              border: '1px solid var(--ev-c-divider)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              pointerEvents: 'none',
              zIndex: 1
            }}>
              {/* Origin Crosshairs */}
              <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            <ImageGraphic
              imageId={macr}
              playerColor="Red"
              maxWidth={256}
              maxHeight={256}
              autoCrop={false}
              animate={true}
              style={{ zIndex: 2 }}
            />

            {/* Draw Placement Box representing Construction Size */}
            {boxWidth > 0 && boxHeight > 0 && (
              <div style={{
                position: 'absolute',
                left: `calc(50% - ${boxWidth / 2}px)`,
                top: `calc(50% - ${boxHeight / 2}px)`,
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
                backgroundColor: 'rgba(50, 150, 255, 0.25)',
                border: '1px dashed rgba(50, 150, 255, 0.6)',
                pointerEvents: 'none',
                zIndex: 9
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphicsTab
