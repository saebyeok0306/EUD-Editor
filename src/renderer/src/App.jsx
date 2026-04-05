import { useState, useEffect } from 'react'
import StartScreen from './components/StartScreen'
import EditorLayout from './components/EditorLayout'
import { initDatStore } from './utils/datStore'
import { I18nProvider } from './i18n/i18nContext'
import { UNIT_GROUPS } from './constants/unitGroups'
import SetupScreen from './components/SetupScreen'
import TitleBar from './components/TitleBar'

function App() {
  const [mapData, setMapData] = useState(null)
  const [datReady, setDatReady] = useState(false)
  const [scPath, setScPath] = useState(undefined) // undefined = checking, null = not set, string = path

  // Load all .dat files once at startup
  useEffect(() => {
    const init = async () => {
      await initDatStore()
      setDatReady(true)
      
      const path = await window.api.getStarcraftPath()
      setScPath(path)
    }
    init()
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
    upgrades: {},
    images: {}
  })

  const handleCloseMap = () => {
    setMapData(null)
    setProjectData({ units: {}, weapons: {}, upgrades: {}, images: {} })
    window.api.resetWindowSize()
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

  const updateProjectData = (category, id, field, value) => {
    setProjectData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [id]: {
          ...(prev[category]?.[id] || {}),
          [field]: value
        }
      }
    }))
  }
  
  const resetProjectUnit = (unitId, groupId = 'all') => {
    setProjectData(prev => {
      const units = { ...prev.units }
      
      if (groupId === 'all') {
        delete units[unitId]
      } else {
        const fieldsToReset = UNIT_GROUPS[groupId] || []
        if (units[unitId]) {
          const modUnit = { ...units[unitId] }
          fieldsToReset.forEach(f => delete modUnit[f])
          
          // If no fields left, delete the entry
          if (Object.keys(modUnit).length === 0) {
            delete units[unitId]
          } else {
            units[unitId] = modUnit
          }
        }
      }
      
      return { ...prev, units }
    })
  }

  if (scPath === undefined) {
    return <div style={{ height: '100vh', backgroundColor: 'var(--color-background-soft)' }}></div>
  }

  return (
    <I18nProvider>
      <div className="app-container">
        <TitleBar 
          onOpenScx={handleOpenScx} 
          onCloseMap={handleCloseMap} 
          mapLoaded={!!mapData} 
        />
        {scPath === null ? (
          <SetupScreen onCompleted={(path) => setScPath(path)} />
        ) : mapData ? (
          <EditorLayout 
            mapData={mapData} 
            projectData={projectData}
            datReady={datReady} 
            onCloseMap={handleCloseMap} 
            onUpdateProjectUnit={updateProjectUnit}
            onResetProjectUnit={resetProjectUnit}
            onUpdateProjectData={updateProjectData}
          />
        ) : (
          <StartScreen onOpenScx={handleOpenScx} />
        )}
      </div>
    </I18nProvider>
  )
}

export default App


