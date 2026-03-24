import { useI18n } from '../../../i18n/i18nContext'

function BasicInfo({
  selectedItem,
  currentProjectData,
  currentMapData,
  currentEudData,
  unitNames,
  onUpdateProjectUnit
}) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  // Triple-layer data priority: Project > Map > DAT
  const getVal = (field, mapField, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    if (currentMapData && !currentMapData.useDefault && currentMapData[mapField] !== undefined) return currentMapData[mapField]
    return currentEudData?.[eudField] ?? ''
  }

  const hp = getVal('rawHp', 'rawHp', 'Hit Points')
  const shield = getVal('shield', 'shield', 'Shield Amount')
  const armor = getVal('armor', 'armor', 'Armor')
  const buildTime = getVal('buildTime', 'buildTime', 'Build Time')
  const minerals = getVal('minerals', 'minerals', 'Mineral Cost')
  const gas = getVal('gas', 'gas', 'Vespene Cost')

  // EUD-only display values (read-only for now)
  const groundWeapon = getVal('groundWeapon', null, 'Ground Weapon')
  const airWeapon = getVal('airWeapon', null, 'Air Weapon')
  const sightRange = getVal('sightRange', null, 'Sight Range')
  const graphics = getVal('graphics', null, 'Graphics')
  const supplyProvided = getVal('supplyProvided', null, 'Supply Provided')
  const supplyRequired = getVal('supplyRequired', null, 'Supply Required')

  // Helper for modified style
  const getStyle = (field) => {
    const isModified = currentProjectData?.[field] !== undefined
    if (isModified) {
      return { border: '1px solid var(--ev-c-brand)', backgroundColor: 'rgba(100, 108, 255, 0.1)' }
    }
    return {}
  }

  return (
    <>
      <h3 className="properties-title">
        {t('unit.title')}
        {currentMapData?.useDefault && !currentProjectData && <span className="properties-badge">{t('unit.badge.mapDefault')}</span>}
      </h3>

      {/* Map / UNIx editable fields */}
      <div className="prop-grid">
        <label className="prop-label">{t('unit.prop.hitPoints')}</label>
        <div className="prop-split-input">
          <div className="left-part">
            <input
              className="prop-input"
              type="number"
              value={hp}
              style={getStyle('rawHp')}
              onChange={(e) => onUpdateProjectUnit(selectedItem, 'rawHp', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="right-part">
            ({Math.max(1, Math.floor((Number(hp) || 0) / 256))})
          </div>
        </div>

        <label className="prop-label">{t('unit.prop.shieldPoints')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            className="prop-input"
            type="number"
            value={shield}
            style={{ flex: 1, ...getStyle('shield') }}
            onChange={(e) => onUpdateProjectUnit(selectedItem, 'shield', parseInt(e.target.value) || 0)}
          />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            color: 'var(--ev-c-text-2)'
          }}>
            <input
              type="checkbox"
              checked={getVal('shieldEnable', 'shieldEnable', 'Shield Enable') === 1}
              onChange={(e) => onUpdateProjectUnit(selectedItem, 'shieldEnable', e.target.checked ? 1 : 0)}
              style={{ margin: 0 }}
            />
            {t('unit.prop.shieldEnable')}
          </label>
        </div>

        <label className="prop-label">{t('unit.prop.armor')}</label>
        <input
          className="prop-input"
          type="number"
          value={armor}
          style={getStyle('armor')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'armor', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.buildTime')}</label>
        <input
          className="prop-input"
          type="number"
          value={buildTime}
          style={getStyle('buildTime')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'buildTime', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.mineralCost')}</label>
        <input
          className="prop-input"
          type="number"
          value={minerals}
          style={getStyle('minerals')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'minerals', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.gasCost')}</label>
        <input
          className="prop-input"
          type="number"
          value={gas}
          style={getStyle('gas')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'gas', parseInt(e.target.value) || 0)}
        />
      </div>

      {/* EUD-only fields (units.dat) */}
      <h4 className="properties-section-title">{t('unit.section.eud')}</h4>
      <div className="prop-grid">
        <label className="prop-label">{t('unit.prop.groundWeapon')}</label>
        <input
          className="prop-input"
          type="number"
          value={groundWeapon}
          style={getStyle('groundWeapon')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'groundWeapon', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.airWeapon')}</label>
        <input
          className="prop-input"
          type="number"
          value={airWeapon}
          style={getStyle('airWeapon')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'airWeapon', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.sightRange')}</label>
        <input
          className="prop-input"
          type="number"
          value={sightRange}
          style={getStyle('sightRange')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'sightRange', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.graphics')}</label>
        <input
          className="prop-input"
          type="number"
          value={graphics}
          style={getStyle('graphics')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'graphics', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.supplyProvided')}</label>
        <input
          className="prop-input"
          type="number"
          value={supplyProvided}
          style={getStyle('supplyProvided')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'supplyProvided', parseInt(e.target.value) || 0)}
        />

        <label className="prop-label">{t('unit.prop.supplyRequired')}</label>
        <input
          className="prop-input"
          type="number"
          value={supplyRequired}
          style={getStyle('supplyRequired')}
          onChange={(e) => onUpdateProjectUnit(selectedItem, 'supplyRequired', parseInt(e.target.value) || 0)}
        />
      </div>
    </>
  )
}

export default BasicInfo
