import { useState, useEffect } from 'react'
import unitsText from '../../data/Units.txt?raw'
import { getUnitsData } from '../../utils/datStore'

const UNIT_NAMES = unitsText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

function UnitTab({ mapData, datReady }) {
  const [selectedItem, setSelectedItem] = useState(null)
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

  const displayHp = currentMapData && !currentMapData.useDefault ? currentMapData.rawHp : (currentEudData?.['Hit Points'] ?? '') / (currentEudData ? 256 : 1) || ''
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
          <div>
            <h3 className="properties-title">
              Unit Properties (EUD + Map Data)
              {currentMapData?.useDefault && <span className="properties-badge">Map Default</span>}
            </h3>

            {/* Map / UNIx editable fields */}
            <div className="prop-grid">
              <span className="prop-label">ID</span>
              <span className="prop-value-text">{selectedItem.toString().padStart(3, '0')}</span>
              <div />
              <div />

              <label className="prop-label">Name</label>
              <input className="prop-input prop-span-3" type="text" readOnly value={UNIT_NAMES[selectedItem]} />

              <label className="prop-label">Hit Points</label>
              <input className="prop-input" type="number" readOnly value={currentMapData && !currentMapData.useDefault ? currentMapData.rawHp : (currentEudData ? currentEudData['Hit Points'] : '')} />

              <label className="prop-label">Shield Points</label>
              <input className="prop-input" type="number" readOnly value={displayShield} />

              <label className="prop-label">Armor</label>
              <input className="prop-input" type="number" readOnly value={displayArmor} />

              <label className="prop-label">Build Time</label>
              <input className="prop-input" type="number" readOnly value={displayBuildTime} />

              <label className="prop-label">Mineral Cost</label>
              <input className="prop-input" type="number" readOnly value={displayMinCost} />

              <label className="prop-label">Gas Cost</label>
              <input className="prop-input" type="number" readOnly value={displayGasCost} />
            </div>

            {/* EUD-only fields (units.dat) */}
            <h4 className="properties-section-title">EUD External Link Properties</h4>
            <div className="prop-grid">
              <label className="prop-label">Ground Weapon</label>
              <input className="prop-input eud" type="number" readOnly value={displayGroundWeapon} />

              <label className="prop-label">Air Weapon</label>
              <input className="prop-input eud" type="number" readOnly value={displayAirWeapon} />

              <label className="prop-label">Sight Range</label>
              <input className="prop-input" type="number" readOnly value={displaySightRange} />

              <label className="prop-label">Graphics (Sprite ID)</label>
              <input className="prop-input" type="number" readOnly value={displayGraphics} />

              <label className="prop-label">Supply Provided</label>
              <input className="prop-input" type="number" readOnly value={displaySupply} />

              <label className="prop-label">Supply Required</label>
              <input className="prop-input" type="number" readOnly value={displaySupplyReq} />
            </div>
          </div>
        ) : (
          <div className="properties-empty">
            <div className="properties-empty-icon">📄</div>
            <div className="properties-empty-text">Select a Unit to view and edit its properties</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnitTab
