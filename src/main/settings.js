import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const settingsPath = path.join(app.getPath('userData'), 'settings.json')

export function getSettings() {
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
