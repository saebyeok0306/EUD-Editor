import { useI18n } from '../../../i18n/i18nContext'
import DatIcon from '../../common/DatIcon'
import '../../common/TabCommon.css'

function Field({ label, value, onChange, modified, addon, type = "number", className = "", style }) {
  return (
    <div className={`field-group ${className}`} style={style}>
      <label className="field-label">{label}</label>
      <div className="value-row">
        <input
          type={type}
          className={`modern-input ${modified ? 'modified' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(type === "number" ? (parseInt(e.target.value) || 0) : e.target.value)}
        />
        {addon && <span className="addon-text">{addon}</span>}
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="info-card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

function DatIconField({ label, id, data, statTxt, grfPath, onConfirm }) {
  // Common placeholders for "None": 130 for Weapons, 255/61 for Upgrades
  const isNone = id === 130 || id === 255 || id === 61 || !data || !data[id]
  const item = isNone ? null : data[id]
  const nameIdx = item?.['Label'] ? item['Label'] - 1 : -1
  const name = isNone ? 'None' : (nameIdx >= 0 && statTxt?.[nameIdx] ? statTxt[nameIdx] : `Unknown (ID: ${id})`)
  const iconIdx = item?.['Icon']

  return (
    <div className="icon-field-row">
      <DatIcon frameIndex={iconIdx} grfPath={grfPath} />
      <div className="icon-label-container">
        {label && <div className="icon-sub-label">{label}</div>}
        <div className="icon-main-label">{name} {id !== undefined && `(ID: ${id})`}</div>
      </div>
      <button className="btn-confirm" onClick={onConfirm}>확인</button>
    </div>
  )
}

function BasicInfo({
  selectedItem,
  currentProjectData,
  currentMapData,
  currentEudData,
  onUpdateProjectUnit,
  onResetProjectUnit,
  weaponsData,
  upgradesData,
  statTxt
}) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  const getVal = (field, mapField, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    if (currentMapData && !currentMapData.useDefault && currentMapData[mapField] !== undefined) return currentMapData[mapField]
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // Field Getters
  const maxHp = getVal('maxHp', 'rawHp', 'Hit Points')
  const maxShield = getVal('maxShield', 'shield', 'Shield Amount')
  const hasShield = getVal('hasShield', 'shieldEnable', 'Shield Enable')
  const armorUpgrade = getVal('armorUpgrade', null, 'Armor Upgrade')
  const armor = getVal('armor', 'armor', 'Armor')

  const mineralCost = getVal('mineralCost', 'minerals', 'Mineral Cost')
  const gasCost = getVal('gasCost', 'gas', 'Vespene Cost')
  const timeCost = getVal('timeCost', 'buildTime', 'Build Time')
  const broodWarFlag = getVal('broodWarFlag', null, 'Broodwar Unit Flag')
  const buildScore = getVal('buildScore', null, 'Build Score')
  const killScore = getVal('killScore', null, 'Destroy Score')

  const groundWeapon = getVal('groundWeapon', null, 'Ground Weapon')
  const airWeapon = getVal('airWeapon', null, 'Air Weapon')
  const maxGroundHits = getVal('maxGroundHits', null, 'Max Ground Hits')
  const maxAirHits = getVal('maxAirHits', null, 'Max Air Hits')

  const supplyUsed = getVal('supplyUsed', null, 'Supply Required')
  const supplyProvided = getVal('supplyProvided', null, 'Supply Provided')
  const transportSpaceRequired = getVal('transportSpaceRequired', null, 'Space Required')
  const transportSpaceProvided = getVal('transportSpaceProvided', null, 'Space Provided')

  const sightRange = getVal('sightRange', null, 'Sight Range')
  const seekRange = getVal('seekRange', null, 'Target Acquisition Range')
  const sizeType = getVal('sizeType', null, 'Unit Size')

  return (
    <div className="tab-detail-container">
      <div className="tab-detail-grid">
        {/* Section 1: 유닛 생체 정보 */}
        <Card title={t('unit.section.bio') || '유닛 생체 정보'}>
          <div className="field-group">
            <label className="field-label">{t('unit.prop.maxHp')}</label>
            <div className="value-row" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <input
                  type="number"
                  className={`modern-input ${isMod('maxHp') ? 'modified' : ''}`}
                  value={Math.floor((maxHp || 0) / 256)}
                  onChange={(e) => onUpdateProjectUnit(selectedItem, 'maxHp', (parseInt(e.target.value) || 0) * 256)}
                  title="Actual Hit Points"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <input
                  type="number"
                  className={`modern-input ${isMod('maxHp') ? 'modified' : ''}`}
                  value={maxHp || 0}
                  onChange={(e) => onUpdateProjectUnit(selectedItem, 'maxHp', parseInt(e.target.value) || 0)}
                  title="Raw Hit Points"
                />
              </div>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">{t('unit.prop.maxShield')}</label>
            <div className="value-row">
              <input
                type="number"
                className={`modern-input ${isMod('maxShield') ? 'modified' : ''}`}
                value={maxShield}
                onChange={(e) => onUpdateProjectUnit(selectedItem, 'maxShield', parseInt(e.target.value) || 0)}
                style={{ flex: 1 }}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasShield === 1}
                  onChange={(e) => onUpdateProjectUnit(selectedItem, 'hasShield', e.target.checked ? 1 : 0)}
                />
                {t('unit.prop.hasShield') || '사용'}
              </label>
            </div>
          </div>
          <DatIconField
            label={t('unit.prop.armorUpgrade') || '방어구 업그레이드'}
            id={armorUpgrade}
            data={upgradesData}
            statTxt={statTxt}
            onConfirm={() => { }}
          />
          <Field
            label={t('unit.prop.armor') || '방어력'}
            value={armor}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'armor', v)}
            modified={isMod('armor')}
          />
        </Card>

        {/* Section 2: 생산정보 */}
        <Card title={t('unit.section.production') || '생산 정보'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.mineralCost')}
              value={mineralCost}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'mineralCost', v)}
              modified={isMod('mineralCost')}
            />
            <label className="checkbox-label" style={{ alignSelf: 'center' }}>
              <input
                type="checkbox"
                checked={broodWarFlag === 1}
                onChange={(e) => onUpdateProjectUnit(selectedItem, 'broodWarFlag', e.target.checked ? 1 : 0)}
              />
              {t('unit.prop.broodWarFlag') || '브루드워유닛'}
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.gasCost')}
              value={gasCost}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'gasCost', v)}
              modified={isMod('gasCost')}
            />
            <Field
              label={t('unit.prop.buildScore') || '생산점수'}
              value={buildScore}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'buildScore', v)}
              modified={isMod('buildScore')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.timeCost')}
              value={timeCost}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'timeCost', v)}
              modified={isMod('timeCost')}
            />
            <Field
              label={t('unit.prop.killScore') || '파괴점수'}
              value={killScore}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'killScore', v)}
              modified={isMod('killScore')}
            />
          </div>
        </Card>

        {/* Section 3: 무기 */}
        <Card title={t('unit.section.weapons') || '무기'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '60px', color: 'var(--ev-c-text-2)', fontSize: '13px', fontWeight: '500' }}>
                {t('unit.prop.groundWeapon')}
              </div>
              <div style={{ flex: '0 0 50%' }}>
                <DatIconField
                  id={groundWeapon}
                  data={weaponsData}
                  statTxt={statTxt}
                  onConfirm={() => { }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Field
                  label={t('unit.prop.maxGroundHits') || '타격수'}
                  value={maxGroundHits}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'maxGroundHits', v)}
                  modified={isMod('maxGroundHits')}
                  style={{ display: 'flex', gap: '8px', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '60px', color: 'var(--ev-c-text-2)', fontSize: '13px', fontWeight: '500' }}>
                {t('unit.prop.airWeapon')}
              </div>
              <div style={{ flex: '0 0 50%' }}>
                <DatIconField
                  id={airWeapon}
                  data={weaponsData}
                  statTxt={statTxt}
                  onConfirm={() => { }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Field
                  label={t('unit.prop.maxAirHits') || '타격수'}
                  value={maxAirHits}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'maxAirHits', v)}
                  modified={isMod('maxAirHits')}
                  style={{ display: 'flex', gap: '8px', width: '100%' }}
                />
              </div>

            </div>
          </div>
        </Card>

        {/* Section 4: 인구 & 탑승공간 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card title={t('unit.section.population') || '인구'}>
            <Field
              label={t('unit.prop.supplyUsed')}
              value={supplyUsed}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'supplyUsed', v)}
              modified={isMod('supplyUsed')}
            />
            <Field
              label={t('unit.prop.supplyProvided')}
              value={supplyProvided}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'supplyProvided', v)}
              modified={isMod('supplyProvided')}
            />
          </Card>
          <Card title={t('unit.section.transport') || '탑승공간'}>
            <Field
              label={t('unit.prop.transportSpaceRequired') || '필요 공간'}
              value={transportSpaceRequired}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'transportSpaceRequired', v)}
              modified={isMod('transportSpaceRequired')}
            />
            <Field
              label={t('unit.prop.transportSpaceProvided') || '탑승 공간'}
              value={transportSpaceProvided}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'transportSpaceProvided', v)}
              modified={isMod('transportSpaceProvided')}
            />
          </Card>
        </div>

        {/* Section 5: 기타정보 */}
        <Card title={t('unit.section.misc') || '기타 정보'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.sightRange')}
              value={sightRange}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'sightRange', v)}
              modified={isMod('sightRange')}
            />
            <Field
              label={t('unit.prop.seekRange') || '인지거리'}
              value={seekRange}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'seekRange', v)}
              modified={isMod('seekRange')}
            />
          </div>
          <div className="field-group">
            <label className="field-label">{t('unit.prop.sizeType') || '방어타입'}</label>
            <select
              className={`modern-input ${isMod('sizeType') ? 'modified' : ''}`}
              value={sizeType}
              onChange={(e) => onUpdateProjectUnit(selectedItem, 'sizeType', parseInt(e.target.value))}
            >
              <option value={0}>{t('unit.sizeType.independent') || '독립적인 크기'}</option>
              <option value={1}>{t('unit.sizeType.small') || '소형'}</option>
              <option value={2}>{t('unit.sizeType.medium') || '중형'}</option>
              <option value={3}>{t('unit.sizeType.large') || '대형'}</option>
            </select>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BasicInfo
