import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App() {
  const [mapData, setMapData] = useState(null)

  const handleOpenScx = async () => {
    try {
      const data = await window.api.openScx()
      if (data) {
        setMapData(data)
      }
    } catch (err) {
      alert('Error reading SCX: ' + err)
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">EUD-Editor</div>
      <div className="text">
        Starcraft <span className="react">Map Editor</span>
      </div>
      <p className="tip">
        Click below to parse a Starcraft Map file.
      </p>
      <div className="actions">
        <div className="action">
          <a onClick={handleOpenScx} style={{ cursor: 'pointer' }}>
            Open SCX/SCM File
          </a>
        </div>
      </div>

      {mapData && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px', textAlign: 'left', wordBreak: 'break-all' }}>
          <h3>{mapData.fileName}</h3>
          <p><strong>Title:</strong> {mapData.title}</p>
          <p><strong>Description:</strong> {mapData.description}</p>
          <p><strong>Size:</strong> {mapData.size[0]} x {mapData.size[1]}</p>
        </div>
      )}
      <Versions></Versions>
    </>
  )
}

export default App
