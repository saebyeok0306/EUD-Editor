import { useI18n } from '../../../i18n/i18nContext'
import DatIcon from '../../common/DatIcon'
import './UnitTab.css'

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
  const hp = getVal('rawHp', 'rawHp', 'Hit Points')
  const shield = getVal('shield', 'shield', 'Shield Amount')
  const shieldEnable = getVal('shieldEnable', 'shieldEnable', 'Shield Enable')
  const armorUpgrade = getVal('armorUpgrade', null, 'Armor Upgrade')
  const armor = getVal('armor', 'armor', 'Armor')

  const minerals = getVal('minerals', 'minerals', 'Mineral Cost')
  const gas = getVal('gas', 'gas', 'Vespene Cost')
  const buildTime = getVal('buildTime', 'buildTime', 'Build Time')
  const bwFlag = getVal('bwFlag', null, 'Broodwar Unit Flag')
  const buildScore = getVal('buildScore', null, 'Build Score')
  const destroyScore = getVal('destroyScore', null, 'Destroy Score')

  const gWep = getVal('groundWeapon', null, 'Ground Weapon')
  const aWep = getVal('airWeapon', null, 'Air Weapon')
  const gHits = getVal('maxGroundHits', null, 'Max Ground Hits')
  const aHits = getVal('maxAirHits', null, 'Max Air Hits')

  const supplyReq = getVal('supplyRequired', null, 'Supply Required')
  const supplyProv = getVal('supplyProvided', null, 'Supply Provided')
  const spaceReq = getVal('spaceRequired', null, 'Space Required')
  const spaceProv = getVal('spaceProvided', null, 'Space Provided')

  const sight = getVal('sightRange', null, 'Sight Range')
  const targetAcq = getVal('targetAcquisitionRange', null, 'Target Acquisition Range')
  const unitSize = getVal('unitSize', null, 'Unit Size')

  return (
    <div className="unit-detail-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button
          className="btn-reset-tab"
          onClick={() => {
            if (confirm(t('unit.reset.confirmTab'))) {
              onResetProjectUnit(selectedItem, 'basic')
            }
          }}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--ev-c-text-2)'
          }}
        >
          {t('unit.reset.tab')}
        </button>
      </div>

      <div className="unit-detail-grid">
        {/* Section 1: 유닛 생체 정보 */}
        <Card title={t('unit.section.bio') || '유닛 생체 정보'}>
          <Field
            label={t('unit.prop.hitPoints')}
            value={hp}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'rawHp', v)}
            modified={isMod('rawHp')}
            addon={`(${Math.floor(hp / 256)})`}
          />
          <div className="field-group">
            <label className="field-label">{t('unit.prop.shieldPoints')}</label>
            <div className="value-row">
              <input
                type="number"
                className={`modern-input ${isMod('shield') ? 'modified' : ''}`}
                value={shield}
                onChange={(e) => onUpdateProjectUnit(selectedItem, 'shield', parseInt(e.target.value) || 0)}
                style={{ flex: 1 }}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={shieldEnable === 1}
                  onChange={(e) => onUpdateProjectUnit(selectedItem, 'shieldEnable', e.target.checked ? 1 : 0)}
                />
                {t('unit.prop.shieldEnable') || '사용'}
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
              value={minerals}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'minerals', v)}
              modified={isMod('minerals')}
            />
            <label className="checkbox-label" style={{ alignSelf: 'center' }}>
              <input
                type="checkbox"
                checked={bwFlag === 1}
                onChange={(e) => onUpdateProjectUnit(selectedItem, 'bwFlag', e.target.checked ? 1 : 0)}
              />
              {t('unit.prop.bwUnit') || '브루드워유닛'}
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.gasCost')}
              value={gas}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'gas', v)}
              modified={isMod('gas')}
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
              label={t('unit.prop.buildTime')}
              value={buildTime}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'buildTime', v)}
              modified={isMod('buildTime')}
            />
            <Field
              label={t('unit.prop.destroyScore') || '파괴점수'}
              value={destroyScore}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'destroyScore', v)}
              modified={isMod('destroyScore')}
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
                  id={gWep}
                  data={weaponsData}
                  statTxt={statTxt}
                  onConfirm={() => { }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Field
                  label={t('unit.prop.weaponHits') || '타격수'}
                  value={gHits}
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
                  id={aWep}
                  data={weaponsData}
                  statTxt={statTxt}
                  onConfirm={() => { }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Field
                  label={t('unit.prop.weaponHits') || '타격수'}
                  value={aHits}
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
              label={t('unit.prop.supplyRequired')}
              value={supplyReq}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'supplyRequired', v)}
              modified={isMod('supplyRequired')}
            />
            <Field
              label={t('unit.prop.supplyProvided')}
              value={supplyProv}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'supplyProvided', v)}
              modified={isMod('supplyProvided')}
            />
          </Card>
          <Card title={t('unit.section.transport') || '탑승공간'}>
            <Field
              label={t('unit.prop.spaceRequired') || '필요 공간'}
              value={spaceReq}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'spaceRequired', v)}
              modified={isMod('spaceRequired')}
            />
            <Field
              label={t('unit.prop.spaceProvided') || '탑승 공간'}
              value={spaceProv}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'spaceProvided', v)}
              modified={isMod('spaceProvided')}
            />
          </Card>
        </div>

        {/* Section 5: 기타정보 */}
        <Card title={t('unit.section.misc') || '기타 정보'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Field
              label={t('unit.prop.sightRange')}
              value={sight}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'sightRange', v)}
              modified={isMod('sightRange')}
            />
            <Field
              label={t('unit.prop.targetAcqRange') || '인지거리'}
              value={targetAcq}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'targetAcquisitionRange', v)}
              modified={isMod('targetAcquisitionRange')}
            />
          </div>
          <div className="field-group">
            <label className="field-label">{t('unit.prop.armorType') || '방어타입'}</label>
            <select
              className={`modern-input ${isMod('unitSize') ? 'modified' : ''}`}
              value={unitSize}
              onChange={(e) => onUpdateProjectUnit(selectedItem, 'unitSize', parseInt(e.target.value))}
            >
              <option value={0}>{t('unit.armorType.independent') || '독립적인 크기'}</option>
              <option value={1}>{t('unit.armorType.small') || '소형'}</option>
              <option value={2}>{t('unit.armorType.medium') || '중형'}</option>
              <option value={3}>{t('unit.armorType.large') || '대형'}</option>
            </select>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BasicInfo
