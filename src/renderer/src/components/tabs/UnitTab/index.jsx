import { useState, useEffect } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import unitsText from '../../../data/Units.txt?raw'
import { getUnitsData } from '../../../utils/datStore'

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
  { id: 'basic',    key: 'unit.tab.basic' },
  { id: 'advanced', key: 'unit.tab.advanced' },
  { id: 'sound',    key: 'unit.tab.sound' },
  { id: 'graphics', key: 'unit.tab.graphics' },
  { id: 'edit',     key: 'unit.tab.edit' },
  { id: 'ai',       key: 'unit.tab.ai' },
  { id: 'ui',       key: 'unit.tab.ui' },
  { id: 'req',      key: 'unit.tab.req' },
]

function UnitTab({ mapData, datReady }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('basic')
  const [listWidth, setListWidth] = useState(300)
  const [isDragging, setIsDragging] = useState(false)

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
    const commonProps = {
      selectedItem,
      currentMapData,
      currentEudData,
      unitNames: UNIT_NAMES
    }

    switch (activeSubTab) {
      case 'basic':    return <BasicInfo {...commonProps} />
      case 'advanced': return <AdvancedInfo {...commonProps} />
      case 'sound':    return <SoundTab {...commonProps} />
      case 'graphics': return <GraphicsTab {...commonProps} />
      case 'edit':     return <EditTab {...commonProps} />
      case 'ai':       return <AIOrders {...commonProps} />
      case 'ui':       return <UIPreview {...commonProps} />
      case 'req':      return <Requirements {...commonProps} />
      default:         return null
    }
  }

  return (
    <div className="content-body">
      {/* Left Pane: Items List */}
      <div className="items-list-pane" style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}>
        {UNIT_NAMES.map((name, i) => (
          <div
            key={i}
            className={`list-item${selectedItem === i ? ' active' : ''}`}
            onClick={() => setSelectedItem(i)}
          >
            <span className="list-item-id">{i.toString().padStart(3, '0')}</span>
            <span className="list-item-name">{name}</span>
          </div>
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
            <div style={{ flex: 1, overflowY: 'auto' }}>
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
