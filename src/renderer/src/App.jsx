import { useState, useEffect } from 'react'
import StartScreen from './components/StartScreen'
import EditorLayout from './components/EditorLayout'
import { initDatStore } from './utils/datStore'
import { I18nProvider } from './i18n/i18nContext'
import { UNIT_GROUPS } from './constants/unitGroups'
import SetupScreen from './components/SetupScreen'
import TitleBar from './components/TitleBar'
import { NavigationProvider } from './contexts/NavigationContext'

function App() {
  const [mapData, setMapData] = useState(null)
  const [datReady, setDatReady] = useState(false)
  const [scPath, setScPath] = useState(undefined) // undefined = checking, null = not set, string = path
  const [projectPath, setProjectPath] = useState(null)
  const [projectName, setProjectName] = useState(null)

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

  const handleCreateProject = async () => {
    try {
      const data = await window.api.createProject()
      if (data) {
        setProjectPath(data.projectPath)
        setProjectName(data.projectName)
        setMapData(data.mapData)
        setProjectData(data.projectData)
      }
    } catch (err) {
      alert('Error creating project: ' + err)
    }
  }

  const handleOpenProject = async () => {
    try {
      const data = await window.api.openProject()
      if (data) {
        setProjectPath(data.projectPath)
        setProjectName(data.projectName)
        setMapData(data.mapData)
        setProjectData(data.projectData)
      }
    } catch (err) {
      alert('Error opening project: ' + err)
    }
  }

  const handleSaveProject = async () => {
    if (!projectPath || !mapData) return;
    try {
      const success = await window.api.saveProject(projectPath, {
        mapPath: mapData.filePath,
        projectData: projectData
      })
      if (success) {
        console.log('Project saved successfully.')
      }
    } catch (err) {
      alert('Error saving project: ' + err)
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
    setProjectPath(null)
    setProjectName(null)
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
      <NavigationProvider>
        <div className="app-container">
          <TitleBar 
            onCreateProject={handleCreateProject}
            onOpenProject={handleOpenProject}
            projectPath={projectPath}
            projectName={projectName}
            onSaveProject={handleSaveProject}
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
            <StartScreen 
              onCreateProject={handleCreateProject} 
              onOpenProject={handleOpenProject}
              onOpenSettings={() => setScPath(null)}
            />
          )}
        </div>
      </NavigationProvider>
    </I18nProvider>
  )
}

export default App


