import { useI18n } from '../../../i18n/i18nContext'

function BasicInfo({
  selectedItem,
  currentMapData,
  currentEudData,
  unitNames
}) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  console.log(currentMapData)

  const displayHp = currentMapData && !currentMapData.useDefault ? currentMapData.rawHp : (currentEudData?.['Hit Points'] ?? '')
  const displayShield = currentMapData && !currentMapData.useDefault ? currentMapData.shield : (currentEudData?.['Shield Amount'] ?? '')
  const displayArmor = currentMapData && !currentMapData.useDefault ? currentMapData.armor : (currentEudData?.['Armor'] ?? '')
  const displayBuildTime = currentMapData && !currentMapData.useDefault ? currentMapData.buildTime : (currentEudData?.['Build Time'] ?? '')
  const displayMinCost = currentMapData && !currentMapData.useDefault ? currentMapData.minerals : (currentEudData?.['Mineral Cost'] ?? '')
  const displayGasCost = currentMapData && !currentMapData.useDefault ? currentMapData.gas : (currentEudData?.['Vespene Cost'] ?? '')
  const displayGroundWeapon = currentEudData?.['Ground Weapon'] ?? ''
  const displayAirWeapon = currentEudData?.['Air Weapon'] ?? ''
  const displaySightRange = currentEudData?.['Sight Range'] ?? ''
  const displaySupply = currentEudData?.['Supply Provided'] ?? ''
  const displaySupplyReq = currentEudData?.['Supply Required'] ?? ''
  const displayGraphics = currentEudData?.['Graphics'] ?? ''

  return (
    <>
      <h3 className="properties-title">
        {t('unit.title')}
        {currentMapData?.useDefault && <span className="properties-badge">{t('unit.badge.mapDefault')}</span>}
      </h3>

      {/* Map / UNIx editable fields */}
      <div className="prop-grid">
        <span className="prop-label">{t('unit.prop.id')}</span>
        <span className="prop-value-text">{selectedItem.toString().padStart(3, '0')}</span>
        <div /><div />

        <label className="prop-label">{t('unit.prop.name')}</label>
        <input className="prop-input prop-span-3" type="text" readOnly value={unitNames[selectedItem]} />

        <label className="prop-label">{t('unit.prop.hitPoints')}</label>
        <div className="prop-split-input">
          <div className="left-part">
            <input
              className="prop-input"
              type="number"
              readOnly
              value={displayHp}
            />
          </div>
          <div className="right-part">
            ({Math.max(1, Math.floor((Number(displayHp) || 0) / 256))})
          </div>
        </div>

        <label className="prop-label">{t('unit.prop.shieldPoints')}</label>
        <input className="prop-input" type="number" readOnly value={displayShield} />

        <label className="prop-label">{t('unit.prop.armor')}</label>
        <input className="prop-input" type="number" readOnly value={displayArmor} />

        <label className="prop-label">{t('unit.prop.buildTime')}</label>
        <input className="prop-input" type="number" readOnly value={displayBuildTime} />

        <label className="prop-label">{t('unit.prop.mineralCost')}</label>
        <input className="prop-input" type="number" readOnly value={displayMinCost} />

        <label className="prop-label">{t('unit.prop.gasCost')}</label>
        <input className="prop-input" type="number" readOnly value={displayGasCost} />
      </div>

      {/* EUD-only fields (units.dat) */}
      <h4 className="properties-section-title">{t('unit.section.eud')}</h4>
      <div className="prop-grid">
        <label className="prop-label">{t('unit.prop.groundWeapon')}</label>
        <input className="prop-input eud" type="number" readOnly value={displayGroundWeapon} />

        <label className="prop-label">{t('unit.prop.airWeapon')}</label>
        <input className="prop-input eud" type="number" readOnly value={displayAirWeapon} />

        <label className="prop-label">{t('unit.prop.sightRange')}</label>
        <input className="prop-input" type="number" readOnly value={displaySightRange} />

        <label className="prop-label">{t('unit.prop.graphics')}</label>
        <input className="prop-input" type="number" readOnly value={displayGraphics} />

        <label className="prop-label">{t('unit.prop.supplyProvided')}</label>
        <input className="prop-input" type="number" readOnly value={displaySupply} />

        <label className="prop-label">{t('unit.prop.supplyRequired')}</label>
        <input className="prop-input" type="number" readOnly value={displaySupplyReq} />
      </div>
    </>
  )
}

export default BasicInfo
