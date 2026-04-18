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
    <div className="icon-field-row">
      <div className="field-label" style={{ width: '70px', flexShrink: 0 }}>{label}</div>
      <input
        type="number"
        className="modern-input"
        style={{ width: '60px', flex: 'none' }}
        value={value ?? 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
      {imageId !== undefined && (
        <div className="small-graphic-box">
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
        style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}
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
  const flingy = getVal('flingy', 'Graphics')
  const constructionGraphic = getVal('constructionGraphic', 'Construction Animation')
  const portrait = getVal('portrait', 'Portrait')
  const elevation = getVal('elevation', 'Elevation Level')
  const startDirection = getVal('startDirection', 'Unit Direction')

  const unitBoundsL = getVal('unitBoundsL', 'Unit Size Left')
  const unitBoundsR = getVal('unitBoundsR', 'Unit Size Right')
  const unitBoundsT = getVal('unitBoundsT', 'Unit Size Up')
  const unitBoundsB = getVal('unitBoundsB', 'Unit Size Down')

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
      <Card title={t('unit.graphics.info') || '그래픽 정보'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DatSelectRow
            label={t('unit.graphics.flingy') || '비행정보(Flingy)'}
            value={flingy}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'flingy', v)}
            options={flingyOptions}
            imageId={flingyImageId}
            onNavigate={(v) => navigateTo('Flingy', v)}
          />
          <DatSelectRow
            label={t('unit.graphics.macr') || '생산모습(Image)'}
            value={constructionGraphic}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'constructionGraphic', v)}
            options={imageOptions}
            imageId={constructionGraphic}
            onNavigate={(v) => navigateTo('Image', v)}
          />
          <DatSelectRow
            label={t('unit.graphics.portrait') || '얼굴모습(Portrait)'}
            value={portrait}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'portrait', v)}
            options={portraitOptions}
          />

          {/* Elevation & Direction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
            <div className="field-group" style={{ gridTemplateColumns: '60px 1fr' }}>
              <label className="field-label">{t('unit.graphics.elevation') || '높이'}</label>
              <div className="value-row">
                <SearchableSelect
                  className={`modern-input ${isMod('elevation') ? 'modified' : ''}`}
                  options={ELEVATION_OPTIONS.find(o => o.value === elevation) ? ELEVATION_OPTIONS : [...ELEVATION_OPTIONS, { value: elevation, label: `${elevation} (Custom)` }]}
                  value={elevation}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'elevation', v)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>
            <div className="field-group" style={{ gridTemplateColumns: '60px 1fr' }}>
              <label className="field-label">{t('unit.graphics.direction') || '생산방향'}</label>
              <div className="value-row">
                <SearchableSelect
                  className={`modern-input ${isMod('startDirection') ? 'modified' : ''}`}
                  options={DIRECTION_OPTIONS.find(o => o.value === startDirection) ? DIRECTION_OPTIONS : [...DIRECTION_OPTIONS, { value: startDirection, label: `${startDirection} (Custom)` }]}
                  value={startDirection}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'startDirection', v)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Side: Dimensions */}
        <div style={{ flex: '1 1 280px', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 유닛 크기 */}
          <Card title={t('unit.graphics.unitSize') || '유닛 크기'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Field label={t('unit.graphics.left') || '좌'} value={unitBoundsL} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitBoundsL', v)} modified={isMod('unitBoundsL')} style={{ gridTemplateColumns: '30px 1fr' }} />
              <Field label={t('unit.graphics.right') || '우'} value={unitBoundsR} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitBoundsR', v)} modified={isMod('unitBoundsR')} style={{ gridTemplateColumns: '30px 1fr' }} />
              <Field label={t('unit.graphics.up') || '상'} value={unitBoundsT} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitBoundsT', v)} modified={isMod('unitBoundsT')} style={{ gridTemplateColumns: '30px 1fr' }} />
              <Field label={t('unit.graphics.down') || '하'} value={unitBoundsB} onChange={(v) => onUpdateProjectUnit(selectedItem, 'unitBoundsB', v)} modified={isMod('unitBoundsB')} style={{ gridTemplateColumns: '30px 1fr' }} />
            </div>
          </Card>

          {/* 건설 크기 */}
          <Card title={t('unit.graphics.buildSize') || '건설 크기'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Field label={t('unit.graphics.width') || '너비'} value={boxWidth} onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditPlacementBoxWidth', v)} modified={isMod('starEditPlacementBoxWidth')} style={{ gridTemplateColumns: '40px 1fr' }} />
              <Field label={t('unit.graphics.height') || '높이'} value={boxHeight} onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditPlacementBoxHeight', v)} modified={isMod('starEditPlacementBoxHeight')} style={{ gridTemplateColumns: '40px 1fr' }} />
            </div>
          </Card>

          {/* 애드온 위치 */}
          <Card title={t('unit.graphics.addonPos') || '애드온 위치'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Field label="X" type="number" value={addonX} onChange={(v) => onUpdateProjectUnit(selectedItem, 'addonHorizontalPosition', v)} modified={isMod('addonHorizontalPosition')} style={{ gridTemplateColumns: '24px 1fr' }} disabled />
              <Field label="Y" type="number" value={addonY} onChange={(v) => onUpdateProjectUnit(selectedItem, 'addonVerticalPosition', v)} modified={isMod('addonVerticalPosition')} style={{ gridTemplateColumns: '24px 1fr' }} disabled />
            </div>
          </Card>
        </div>

        {/* Right Side: Preview Boxes */}
        <Card title={t('unit.graphics.preview') || '미리보기'} style={{ flex: '2 1 450px', minWidth: 0, padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', height: '100%' }}>
            {/* Main Visual */}
            <div className="preview-box" style={{ minHeight: '300px', overflow: 'hidden' }}>
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
                backgroundImage: 'linear-gradient(to right, rgba(128, 128, 128, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.2) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                {/* Origin Crosshairs */}
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', backgroundColor: 'rgba(128, 128, 128, 0.5)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(128, 128, 128, 0.5)' }} />
              </div>

              <UnitGraphic
                unitId={selectedItem}
                maxWidth={256}
                maxHeight={256}
                autoCrop={false}
                animate={true}
                direction={startDirection}
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
                left: `calc(50% - ${unitBoundsL}px)`,
                top: `calc(50% - ${unitBoundsT}px)`,
                width: `${unitBoundsL + unitBoundsR}px`,
                height: `${unitBoundsT + unitBoundsB}px`,
                border: '1px solid red',
                pointerEvents: 'none',
                zIndex: 10
              }} />
            </div>

            {/* Secondary Visual (Construction) */}
            <div className="preview-box" style={{ minHeight: '300px', overflow: 'hidden' }}>
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
                backgroundImage: 'linear-gradient(to right, rgba(128, 128, 128, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.2) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                {/* Origin Crosshairs */}
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', backgroundColor: 'rgba(128, 128, 128, 0.5)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(128, 128, 128, 0.5)' }} />
              </div>

              <ImageGraphic
                imageId={constructionGraphic}
                maxWidth={256}
                maxHeight={256}
                autoCrop={false}
                animate={true}
                direction={startDirection}
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
        </Card>
      </div>
    </div>
  )
}

export default GraphicsTab
