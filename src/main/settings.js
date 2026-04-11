import { app } from 'electron'
import path from 'path'
import fs from 'fs'

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function getSettings() {
  const settingsPath = getSettingsPath()
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Error reading settings:', err)
  }
  return {}
}

export function saveSettings(settings) {
  const settingsPath = getSettingsPath()
  try {
    const currentSettings = getSettings()
    const newSettings = { ...currentSettings, ...settings }
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2))
    return true
  } catch (err) {
    console.error('Error saving settings:', err)
    return false
  }
}

export function deleteSettings() {
  const settingsPath = getSettingsPath()
  try {
    if (fs.existsSync(settingsPath)) {
      fs.unlinkSync(settingsPath)
      return true
    }
  } catch (err) {
    console.error('Error deleting settings:', err)
  }
  return false
}

export function addRecentProject(projectPath) {
  try {
    const settings = getSettings()
    let recentProjects = settings.recentProjects || []
    
    // Remove if already exists (to move to front)
    recentProjects = recentProjects.filter(p => p !== projectPath)
    
    // Add to front
    recentProjects.unshift(projectPath)
    
    // Limit to 10 items
    if (recentProjects.length > 10) {
      recentProjects = recentProjects.slice(0, 10)
    }
    
    saveSettings({ recentProjects })
    return recentProjects
  } catch (err) {
    console.error('Error adding recent project:', err)
    return []
  }
}
