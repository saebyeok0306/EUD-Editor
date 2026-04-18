import { useI18n } from '../../../i18n/i18nContext'
import DatIcon from '../../common/DatIcon'
import '../../common/TabCommon.css'

// Constants
const SPECIAL_ABILITY_KEY = 'Special Ability Flags';
const MOVEMENT_KEY = 'Unknown (old Movement)';
const INFESTATION_KEY = 'Infestation';
const SUBUNIT1_KEY = 'Subunit 1';
const SUBUNIT2_KEY = 'Subunit 2';

const SPECIAL_ABILITY_KEYS = [
  'flag.building', 'flag.addon', 'flag.flyer', 'flag.worker', 'flag.subunit', 'flag.flyingBuilding',
  'flag.hero', 'flag.regeneratesHP', 'flag.animatedIdle', 'flag.cloakable', 'flag.twoUnitsIn1Egg', 'flag.singleEntity',
  'flag.resourceDepot', 'flag.resourceContainer', 'flag.roboticUnit', 'flag.detector', 'flag.organicUnit', 'flag.requiresCreep',
  'flag.unused', 'flag.requiresPsi', 'flag.burrowable', 'flag.spellcaster', 'flag.permanentCloak',
  'flag.pickupItem', 'flag.ignoreSupplyCheck', 'flag.useMediumOverlays', 'flag.useLargeOverlays',
  'flag.battleReactions', 'flag.fullAutoAttack', 'flag.invincible', 'flag.mechanicalUnit', 'flag.producesUnits'
];

const MOVEMENT_KEYS = [
  'move.0x01', 'move.0x02', 'move.0x04', 'move.0x08', 'move.0x10', 'move.0x20', 'move.0x40', 'move.ignoreMines'
];

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

function UnitIconField({ label, id, unitNames, onConfirm }) {
  const isNone = id === 228 || id === 65535 || id === undefined;
  const name = isNone ? '없음' : (unitNames[id] || `Unknown (ID: ${id})`);

  return (
    <div className="icon-field-row" style={{ padding: '4px 8px', gap: '8px' }}>
      <div style={{ width: '60px', color: 'var(--ev-c-text-2)', fontSize: '13px', fontWeight: '500' }}>
        {label}
      </div>
      <div className="properties-badge">{isNone ? 'X' : id}</div>
      <DatIcon frameIndex={isNone ? 228 : id} />
      <div className="icon-label-container" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div className="icon-main-label">{name}</div>
      </div>
      <button className="btn-confirm" onClick={onConfirm}>확인</button>
    </div>
  )
}

function BitfieldCheckboxes({ value, labels, isMod, rows, onChange }) {
  // Pad the array if needed so we can iterate in a grid properly
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${rows}, auto)`,
      gridAutoFlow: 'column',
      gap: '4px 12px',
      padding: '8px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '6px',
      border: `1px solid ${isMod ? 'var(--ev-c-brand)' : 'var(--ev-c-divider)'}`
    }}>
      {labels.map((label, bitIndex) => {
        const checked = (value & (1 << bitIndex)) !== 0;
        return (
          <label key={bitIndex} className="checkbox-label" style={{
            fontSize: '12px',
            color: checked ? 'var(--ev-c-text-1)' : 'var(--ev-c-text-3)',
            whiteSpace: 'nowrap'
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const bitMask = 1 << bitIndex;
                const newValue = e.target.checked ? (value | bitMask) : (value & ~bitMask);
                onChange(newValue >>> 0); // Convert to unsigned integer
              }}
            />
            {label}
          </label>
        );
      })}
    </div>
  )
}

function AdvancedInfo({
  selectedItem,
  currentProjectData,
  currentMapData,
  currentEudData,
  unitNames,
  onUpdateProjectUnit,
  onResetProjectUnit
}) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    // Advanced properties usually only have eud/project values, no map value logic in old CHK structure
    // (We did similar for AI Internal flags etc.)
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  const baseProperty = getVal('baseProperty', SPECIAL_ABILITY_KEY)
  const movementFlags = getVal('movementFlags', MOVEMENT_KEY)
  const infestationUnit = getVal('infestationUnit', INFESTATION_KEY)
  const subUnit = getVal('subUnit', SUBUNIT1_KEY)
  const subunit2 = getVal('subunit2', SUBUNIT2_KEY)

  return (
    <div className="tab-detail-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Special Ability Flags */}
        <Card title={t('unit.section.specialAbility') || '스페셜 어빌리티 플래그'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ev-c-text-1)' }}>{t('unit.section.specialAbilityText')}</span>
              <input
              type="text"
              className={`modern-input ${isMod('baseProperty') ? 'modified' : ''}`}
              value={baseProperty.toString(16).toUpperCase()}
              onChange={(e) => {
                const num = parseInt(e.target.value, 16);
                if (!isNaN(num)) onUpdateProjectUnit(selectedItem, 'baseProperty', num);
              }}
              style={{ width: '100px', fontFamily: 'monospace' }}
            />
          </div>
          <BitfieldCheckboxes
            value={baseProperty}
            labels={SPECIAL_ABILITY_KEYS.map(k => t(k))}
            isMod={isMod('baseProperty')}
            rows={8}
            onChange={(newVal) => onUpdateProjectUnit(selectedItem, 'baseProperty', newVal)}
          />
        </Card>

        {/* Section 2: Bottom Row (Misc Data & Movement Flags) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>

          <Card title={t('unit.section.misc2') || '기타정보'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <UnitIconField
                label={t('unit.misc.infestedUnit')}
                id={infestationUnit}
                unitNames={unitNames}
                onConfirm={() => { /* Open unit picker logic if needed in future */ }}
              />
              <UnitIconField
                label={t('unit.misc.subUnit1')}
                id={subUnit}
                unitNames={unitNames}
                onConfirm={() => { }}
              />
              <UnitIconField
                label={t('unit.misc.subUnit2')}
                id={subunit2}
                unitNames={unitNames}
                onConfirm={() => { }}
              />
            </div>
          </Card>

          <Card title={t('unit.section.movementFlags') || '이동플래그'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ev-c-text-1)' }}>{t('unit.section.movementFlagsText')}</span>
              <input
                type="text"
                className={`modern-input ${isMod('movementFlags') ? 'modified' : ''}`}
                value={movementFlags.toString(16).toUpperCase()}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 16);
                  if (!isNaN(num)) onUpdateProjectUnit(selectedItem, 'movementFlags', num);
                }}
                style={{ width: '60px', fontFamily: 'monospace' }}
              />
            </div>
            <BitfieldCheckboxes
              value={movementFlags}
              labels={MOVEMENT_KEYS.map(k => t(k))}
              isMod={isMod('movementFlags')}
              rows={4}
              onChange={(newVal) => onUpdateProjectUnit(selectedItem, 'movementFlags', newVal)}
            />
          </Card>

        </div>
      </div>
    </div>
  )
}

export default AdvancedInfo
