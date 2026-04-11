import { useState, useEffect, memo, useCallback } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import unitsText from '../../../data/Units.txt?raw'
import {
  getUnitsData,
  getWeaponsData,
  getUpgradesData,
  getOrdersData,
  getStatTxt
} from '../../../utils/datStore'
import UnitGraphic from '../../common/UnitGraphic'
import useNavigationTarget from '../../../hooks/useNavigationTarget'

// Sub-components
import BasicInfo from './BasicInfo'
import AdvancedInfo from './AdvancedInfo'
import SoundTab from './Sound'
import GraphicsTab from './Graphics'
import EditTab from './Edit'
import AIOrders from './AIOrders'
import UIPreview from './UIPreview'
import Requirements from './Requirements'

const UNIT_NAMES = unitsText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

const SUB_TABS = [
  { id: 'basic', key: 'unit.tab.basic' },
  { id: 'advanced', key: 'unit.tab.advanced' },
  { id: 'sound', key: 'unit.tab.sound' },
  { id: 'graphics', key: 'unit.tab.graphics' },
  { id: 'edit', key: 'unit.tab.edit' },
  { id: 'ai', key: 'unit.tab.ai' },
  { id: 'ui', key: 'unit.tab.ui' },
  { id: 'req', key: 'unit.tab.req' },
]

const UnitPreview = memo(function UnitPreview({ unitId, name, userDataPath }) {
  // const [hasError, setHasError] = useState(false)
  // const [loaded, setLoaded] = useState(false)

  // // Construct local file URL
  // const previewUrl = userDataPath 
  //   ? `file://${userDataPath}/unit_previews/${unitId}.webp`.replace(/\\/g, '/')
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

  // Fallback if path not ready or error
  return <UnitGraphic unitId={unitId} playerColor="Red" maxWidth={44} maxHeight={44} autoCrop={true} />
})

const UnitListItem = memo(({ i, name, isSelected, isModified, onClick, userDataPath }) => {
  return (
    <div
      className={`list-item${isSelected ? ' active' : ''}`}
      onClick={() => onClick(i)}
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
        <UnitPreview unitId={i} name={name} userDataPath={userDataPath} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ev-c-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
          {isModified && <span style={{ marginLeft: '4px', color: 'var(--ev-c-brand)', fontWeight: 'bold' }}>*</span>}
        </div>
        <div className="list-item-id" style={{ fontSize: '10px', color: 'var(--ev-c-text-3)', marginTop: '2px' }}>
          ID: {i.toString().padStart(3, '0')}
        </div>
      </div>
    </div>
  )
})

function UnitTab({ mapData, projectData, datReady, onUpdateProjectUnit, onResetProjectUnit }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('basic')
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [userDataPath, setUserDataPath] = useState(null)

  useNavigationTarget('Unit', setSelectedItem)

  useEffect(() => {
    window.api.getUserDataPath().then(path => setUserDataPath(path))
  }, [])

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

  const eudUnits = getUnitsData()
  const unitSettingsList = mapData?.unitSettings || []
  const currentMapData = selectedItem !== null && unitSettingsList[selectedItem] ? unitSettingsList[selectedItem] : null
  const currentEudData = (eudUnits && selectedItem !== null) ? eudUnits[selectedItem] : null

  const renderSubTabContent = () => {
    const currentProjectData = selectedItem !== null ? projectData.units[selectedItem] : null
    const commonProps = {
      selectedItem,
      currentProjectData,
      currentMapData,
      currentEudData,
      unitNames: UNIT_NAMES,
      onUpdateProjectUnit,
      onResetProjectUnit,
      weaponsData: getWeaponsData(),
      upgradesData: getUpgradesData(),
      ordersData: getOrdersData(),
      statTxt: getStatTxt()
    }

    switch (activeSubTab) {
      case 'basic': return <BasicInfo {...commonProps} />
      case 'advanced': return <AdvancedInfo {...commonProps} />
      case 'sound': return <SoundTab {...commonProps} />
      case 'graphics': return <GraphicsTab {...commonProps} />
      case 'edit': return <EditTab {...commonProps} />
      case 'ai': return <AIOrders {...commonProps} />
      case 'ui': return <UIPreview {...commonProps} />
      case 'req': return <Requirements {...commonProps} />
      default: return null
    }
  }

  return (
    <div className="content-body">
      {/* Left Pane: Items List */}
      <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}>
        {UNIT_NAMES.map((name, i) => (
          <UnitListItem
            key={i}
            i={i}
            name={name}
            isSelected={selectedItem === i}
            isModified={!!projectData.units[i]}
            onClick={setSelectedItem}
            userDataPath={userDataPath}
          />
        ))}
      </div>

      {/* Resizer */}
      <div
        className={`resizer${isDragging ? ' dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
      />

      {/* Right Pane: Properties */}
      <div className="properties-pane">
        {selectedItem !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header with Reset All */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                className="btn-reset-unit"
                onClick={() => {
                  if (confirm(t('unit.reset.confirmUnit'))) {
                    onResetProjectUnit(selectedItem, 'all')
                  }
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  backgroundColor: 'var(--ev-c-gray-3)',
                  color: 'var(--ev-c-text-1)',
                  border: '1px solid var(--ev-c-divider)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--ev-c-gray-2)';
                  e.target.style.borderColor = 'var(--ev-c-brand)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--ev-c-gray-3)';
                  e.target.style.borderColor = 'var(--ev-c-divider)';
                }}
              >
                {t('unit.reset.all')}
              </button>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="sub-tabs">
              {SUB_TABS.map(tab => (
                <div
                  key={tab.id}
                  className={`sub-tab-item${activeSubTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveSubTab(tab.id)}
                >
                  {t(tab.key)}
                </div>
              ))}
            </div>

            {/* Properties Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              {renderSubTabContent()}

            </div>
          </div>
        ) : (
          <div className="properties-empty">
            <div className="properties-empty-icon">📄</div>
            <div className="properties-empty-text">{t('unit.empty.text')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnitTab
