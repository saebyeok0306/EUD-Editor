import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [playerColor, setPlayerColor] = useState('Red')

  useEffect(() => {
    // Load settings on mount
    const load = async () => {
      if (!window.api?.getSettings) return
      const settings = await window.api.getSettings()
      if (settings.playerColor) {
        setPlayerColor(settings.playerColor)
      }
    }
    load()
  }, [])

  const updatePlayerColor = async (color) => {
    setPlayerColor(color)
    if (window.api?.saveSettings) {
      await window.api.saveSettings({ playerColor: color })
    }
  }

  return (
    <SettingsContext.Provider value={{
      playerColor,
      setPlayerColor: updatePlayerColor
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
