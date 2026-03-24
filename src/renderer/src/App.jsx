import { useState, useEffect } from 'react'
import StartScreen from './components/StartScreen'
import EditorLayout from './components/EditorLayout'
import { initDatStore } from './utils/datStore'
import { I18nProvider } from './i18n/i18nContext'

function App() {
  const [mapData, setMapData] = useState(null)
  const [datReady, setDatReady] = useState(false)

  // Load all .dat files once at startup
  useEffect(() => {
    initDatStore().then(() => setDatReady(true))
  }, [])

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

  const [projectData, setProjectData] = useState({
    units: {},
    weapons: {},
    upgrades: {}
  })

  const handleCloseMap = () => {
    setMapData(null)
    setProjectData({ units: {}, weapons: {}, upgrades: {} })
  }

  const updateProjectUnit = (unitId, field, value) => {
    setProjectData(prev => ({
      ...prev,
      units: {
        ...prev.units,
        [unitId]: {
          ...(prev.units[unitId] || {}),
          [field]: value
        }
      }
    }))
  }

  return (
    <I18nProvider>
      {mapData
        ? <EditorLayout 
            mapData={mapData} 
            projectData={projectData}
            datReady={datReady} 
            onCloseMap={handleCloseMap} 
            onUpdateProjectUnit={updateProjectUnit}
          />
        : <StartScreen onOpenScx={handleOpenScx} />
      }
    </I18nProvider>
  )
}

export default App


