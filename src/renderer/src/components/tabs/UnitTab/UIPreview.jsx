import React from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import DatIcon from '../../common/DatIcon'
import SearchableSelect from '../../common/SearchableSelect'
import '../../common/TabCommon.css'

function Card({ title, children }) {
  return (
    <div className="info-card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}

function UnitSelectField({ label, unitId, isMod, onChange, unitOptions, hasConfirm = false, onConfirm = () => { }, grfPath, disabled = false, iconGrfPath }) {
  const { t } = useI18n()
  const isNone = unitId === 228 || unitId === 65535 || unitId === undefined;

  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '80px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)', opacity: disabled ? 0.5 : 1 }}>
        {label}
      </div>
      <input
        type="number"
        className={`modern-input ${isMod ? 'modified' : ''}`}
        style={{ width: '45px', flex: 'none', textAlign: 'center', padding: '6px 8px' }}
        value={unitId ?? 0}
        disabled={disabled}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) onChange(val)
        }}
      />
      <div style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        backgroundColor: 'var(--ev-c-graphic-bg)',
        borderRadius: '4px',
        border: '1px solid var(--ev-c-divider)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1
      }}>
        <DatIcon
          frameIndex={isNone ? 228 : unitId}
          grfPath={grfPath}
          style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent', maxWidth: '30px', maxHeight: '30px', objectFit: 'contain' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <SearchableSelect
          className={isMod ? 'modified' : ''}
          options={unitOptions}
          value={unitId ?? 0}
          onChange={onChange}
          disabled={disabled}
          iconGrfPath={iconGrfPath}
          style={{
            height: '28px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            padding: '0 8px',
          }}
        />
      </div>
      {hasConfirm && (
        <button className="btn-confirm" onClick={onConfirm}>
          {t('unit.btn.confirm', { defaultValue: '확인' })}
        </button>
      )}
    </div>
  )
}

function ValueField({ label, value, isMod, onChange }) {
  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '80px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)' }}>
        {label}
      </div>
      <input
        type="number"
        className={`modern-input ${isMod ? 'modified' : ''}`}
        style={{ width: '45px', flex: 'none', textAlign: 'center', padding: '6px 8px' }}
        value={value ?? 0}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) onChange(val)
        }}
      />
    </div>
  )
}

function ComboField({ label, value, isMod, onChange, options }) {
  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '80px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)' }}>
        {label}
      </div>
      <div style={{ width: '45px', flexShrink: 0 }}>
        {/* Placeholder to align perfectly with input fields */}
        <input
          type="number"
          className={`modern-input ${isMod ? 'modified' : ''}`}
          style={{ width: '100%', flex: 'none', textAlign: 'center', padding: '6px 8px' }}
          value={value ?? 0}
          readOnly
        />
      </div>
      <div style={{ flex: 1, maxWidth: '200px' }}>
        <SearchableSelect
          className={isMod ? 'modified' : ''}
          options={options}
          value={value ?? 0}
          onChange={onChange}
          style={{
            height: '28px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            padding: '0 8px',
          }}
        />
      </div>
    </div>
  )
}

import { getStatusInforData } from '../../../utils/datStore'

function UIPreview({
  selectedItem,
  currentProjectData,
  currentEudData,
  unitNames,
  onUpdateProjectUnit
}) {
  const { t } = useI18n()
  const statusInforData = getStatusInforData()

  const unitOptions = React.useMemo(() => {
    return unitNames.map((name, i) => ({
      value: i,
      label: `${name}(${i})`
    }))
  }, [unitNames])

  // Wireframe options: number first, with icon thumbnails from the wireframe GRP
  const wireframeOptions = React.useMemo(() => {
    return unitNames.map((name, i) => ({
      value: i,
      icon: i,
      label: `[${String(i).padStart(3, '0')}]  ${name}`
    }))
  }, [unitNames])

  const wireframeOptions130 = React.useMemo(() => {
    return unitNames.slice(0, 131).map((name, i) => ({
      value: i,
      icon: i,
      label: `[${String(i).padStart(3, '0')}]  ${name}`
    }))
  }, [unitNames])

  const UNIT_TYPE_OPTIONS = [
    { value: 0, label: t('unit.ui.type0', { defaultValue: '0  건물' }) },
    { value: 1, label: t('unit.ui.type1', { defaultValue: '1  유닛' }) },
    { value: 2, label: t('unit.ui.type2', { defaultValue: '2  격납유닛' }) },
    { value: 3, label: t('unit.ui.type3', { defaultValue: '3  수송유닛' }) },
    { value: 4, label: t('unit.ui.type4', { defaultValue: '4  수송인구유닛' }) },
    { value: 5, label: t('unit.ui.type5', { defaultValue: '5  파워업유닛' }) },
    { value: 6, label: t('unit.ui.type6', { defaultValue: '6  부화유닛(에그)' }) },
    { value: 7, label: t('unit.ui.type7', { defaultValue: '7  합체유닛(아칸,다크아칸)' }) },
    { value: 8, label: t('unit.ui.type8', { defaultValue: '8  선택불가유닛' }) },
    { value: 9, label: t('unit.ui.type9', { defaultValue: '9  스캐럽, 맵리빌러' }) },
    { value: 10, label: t('unit.ui.type10', { defaultValue: '10  UnusedProtossBuilding' }) },
  ]

  if (selectedItem === null) return null

  const getVal = (field, eudField, statusInforField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    if (statusInforField && statusInforData && statusInforData[selectedItem]) {
      return statusInforData[selectedItem][statusInforField]
    }
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // Retrieve values
  const buttonSet = getVal('buttonSet', 'Action Unit') // FireGraft usually maps buttonset to something similar, we use logical property names.
  const unitType = getVal('unitType', null, 'Unit Type')
  const statusFunction = getVal('statusFunction', null, 'Status Function')
  const displayFunction = getVal('displayFunction', null, 'Display Function')

  const wireframeNormal = currentProjectData?.['wireframe'] !== undefined ? currentProjectData['wireframe'] : selectedItem
  const wireframeGroup = currentProjectData?.['grpWireframe'] !== undefined ? currentProjectData['grpWireframe'] : selectedItem
  const wireframeTransport = currentProjectData?.['tranWireframe'] !== undefined ? currentProjectData['tranWireframe'] : selectedItem

  return (
    <div className="tab-detail-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Top Card: 화면정보 */}
        <Card title={t('unit.ui.title1', { defaultValue: '화면정보' })}>
          <UnitSelectField
            label={t('unit.ui.buttonSet', { defaultValue: '버튼셋' })}
            unitId={buttonSet}
            isMod={isMod('buttonSet')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'buttonSet', v)}
            unitOptions={unitOptions}
            hasConfirm={true}
          />

          <ComboField
            label={t('unit.ui.unitType', { defaultValue: '유닛종류' })}
            value={unitType}
            isMod={isMod('unitType')}
            onChange={(v) => {
              onUpdateProjectUnit(selectedItem, 'unitType', v)

              // Automatically apply mapped statusFunction and displayFunction values
              const mapping = {
                0: { status: 2, display: 1 },
                1: { status: 1, display: 0 },
                2: { status: 4, display: 3 },
                3: { status: 3, display: 2 },
                4: { status: 7, display: 6 },
                5: { status: 8, display: 7 },
                6: { status: 6, display: 5 },
                7: { status: 5, display: 4 },
                8: { status: 0, display: 8 },
                9: { status: 1, display: 8 },
                10: { status: 2, display: 8 }
              };

              if (mapping[v]) {
                onUpdateProjectUnit(selectedItem, 'statusFunction', mapping[v].status)
                onUpdateProjectUnit(selectedItem, 'displayFunction', mapping[v].display)
              }
            }}
            options={UNIT_TYPE_OPTIONS}
          />

          <ValueField
            label={t('unit.ui.statusFunction', { defaultValue: '상태기능' })}
            value={statusFunction}
            isMod={isMod('statusFunction')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'statusFunction', v)}
          />

          <ValueField
            label={t('unit.ui.displayFunction', { defaultValue: '표시기능' })}
            value={displayFunction}
            isMod={isMod('displayFunction')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'displayFunction', v)}
          />
        </Card>

        {/* Bottom Card: 와이어프레임 */}
        <Card title={t('unit.ui.title2', { defaultValue: '와이어프레임' })}>
          <UnitSelectField
            label={t('unit.ui.wireframeNormal', { defaultValue: '일반' })}
            unitId={wireframeNormal}
            isMod={isMod('wireframe')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'wireframe', v)}
            unitOptions={wireframeOptions}
            grfPath="unit/wirefram/wirefram.grp"
            iconGrfPath="unit/wirefram/wirefram.grp"
          />
          <UnitSelectField
            label={t('unit.ui.wireframeGroup', { defaultValue: '부대' })}
            unitId={wireframeGroup}
            isMod={isMod('grpWireframe')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'grpWireframe', v)}
            unitOptions={wireframeOptions130}
            grfPath={selectedItem >= 131 ? null : "unit/wirefram/grpwire.grp"}
            iconGrfPath={selectedItem >= 131 ? null : "unit/wirefram/grpwire.grp"}
            disabled={selectedItem >= 131}
          />
          <UnitSelectField
            label={t('unit.ui.wireframeTransport', { defaultValue: '탑승' })}
            unitId={wireframeTransport}
            isMod={isMod('tranWireframe')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'tranWireframe', v)}
            unitOptions={wireframeOptions130}
            grfPath={selectedItem >= 131 ? null : "unit/wirefram/tranwire.grp"}
            iconGrfPath={selectedItem >= 131 ? null : "unit/wirefram/tranwire.grp"}
            disabled={selectedItem >= 131}
          />
        </Card>

      </div>
    </div>
  )
}

export default UIPreview
