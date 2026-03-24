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

  const handleCloseMap = () => setMapData(null)

  return (
    <I18nProvider>
      {mapData
        ? <EditorLayout mapData={mapData} datReady={datReady} onCloseMap={handleCloseMap} />
        : <StartScreen onOpenScx={handleOpenScx} />
      }
    </I18nProvider>
  )
}

export default App


