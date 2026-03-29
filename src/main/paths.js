import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export function setupPortablePath() {
  let dataPath = null

  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // Case 1: Portable (.exe one-file)
    dataPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data')
  } else if (app.isPackaged) {
    // Case 2: Unpacked folder or Installed
    // We check if we are in a writeable directory or if a 'portable' marker exists.
    // But the simplest is to check if we are NOT in 'Program Files'
    const execDir = path.dirname(process.execPath)
    const isProgramFiles = execDir.toLowerCase().includes('program files')
    
    if (!isProgramFiles) {
      dataPath = path.join(execDir, 'data')
    }
  }

  if (dataPath) {
    if (!fs.existsSync(dataPath)) {
      try {
        fs.mkdirSync(dataPath, { recursive: true })
      } catch (err) {
        console.error('[Paths] Failed to create data directory, falling back to default:', err)
        return
      }
    }
    app.setPath('userData', dataPath)
    console.log(`[Paths] Redirected userData to: ${dataPath}`)
  }
}
