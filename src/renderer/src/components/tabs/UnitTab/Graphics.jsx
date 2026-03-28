import { useState } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { PLAYER_COLORS } from '../../../utils/grpDecoder'
import UnitGraphic from '../../common/UnitGraphic'

function GraphicsTab({ selectedItem }) {
  const { t } = useI18n()
  const [playerColor, setPlayerColor] = useState('Red')
  const [debugInfo, setDebugInfo] = useState(null)

  if (selectedItem === null) {
    return (
      <div className="properties-empty">
        <div className="properties-empty-text">{t('unit.empty.text')}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--ev-c-text-1)', margin: 0 }}>Unit Graphics (Dynamic Renderer)</h3>
        <select
          value={playerColor}
          onChange={(e) => setPlayerColor(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--ev-c-gray-3)',
            color: 'var(--ev-c-text-1)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px'
          }}
        >
          {Object.keys(PLAYER_COLORS).map(color => (
            <option key={color} value={color}>{color} Player</option>
          ))}
        </select>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <UnitGraphic 
          unitId={selectedItem} 
          playerColor={playerColor} 
          maxWidth={250} 
          maxHeight={250} 
          autoCrop={true}
          animate={true}
          onDebugInfo={setDebugInfo}
        />
      </div>

      {debugInfo && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: 'var(--ev-c-bg-mute)',
          borderRadius: '4px',
          fontSize: '0.8em',
          color: 'var(--ev-c-text-3)',
          fontFamily: 'monospace'
        }}>
          <div><strong>Flingy ID:</strong> {debugInfo.flingyId}</div>
          <div><strong>Sprite ID:</strong> {debugInfo.spriteId}</div>
          <div><strong>Image ID:</strong> {debugInfo.imageId}</div>
          <div><strong>images.tbl Index:</strong> {debugInfo.tblIndex}</div>
          <div><strong>Resolved Path:</strong> {debugInfo.path}</div>
        </div>
      )}
    </div>
  )
}

export default GraphicsTab
