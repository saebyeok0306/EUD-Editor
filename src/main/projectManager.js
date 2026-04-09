import { dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import { join, basename } from 'path'
import scmExtractor from 'scm-extractor'
import bwChkData from 'bw-chk'
import { extractChkSection, parseUnixSection } from './chkParser.js'

const createExtractor = scmExtractor.default || scmExtractor
const BwChk = bwChkData.default || bwChkData

export async function loadMapData(filePath) {
  return new Promise((resolve, reject) => {
    const extractor = createExtractor()
    const chunks = []
    
    extractor.on('data', chunk => chunks.push(chunk))
    extractor.on('end', () => {
      try {
        const data = Buffer.concat(chunks)
        const chk = new BwChk(data)
        
        // Custom Parsing for deeper CHK sections (UNIx / UNIS)
        const unixBuffer = extractChkSection(data, 'UNIx') || extractChkSection(data, 'UNIS')
        const unitSettings = parseUnixSection(unixBuffer) || { units: [], weapons: { baseDamage: [], upgradeBonus: [] } }

        const tilesetNames = ['badlands', 'platform', 'install', 'ashworld', 'jungle', 'desert', 'ice', 'twilight']
        const tilesetId = chk.tileset || 0
        const tilesetName = tilesetNames[tilesetId] || 'badlands'

        resolve({
          fileName: basename(filePath),
          filePath,
          title: chk.title,
          description: chk.description,
          size: [chk.size[0], chk.size[1]],
          tileset: tilesetName,
          unitSettings: unitSettings.units,
          weaponSettings: unitSettings.weapons
        })
      } catch (err) {
        reject(err.message)
      }
    })
    extractor.on('error', err => reject(err.message))
    
    fs.createReadStream(filePath).pipe(extractor)
  })
}

export async function createProject(windowEvent) {
  // 1. Select where to save .eep project
  const { canceled: eepCanceled, filePath: projectPath } = await dialog.showSaveDialog({
    title: 'Create New EUD Editor Project',
    defaultPath: 'NewProject.eep',
    filters: [{ name: 'EUD Editor Project', extensions: ['eep'] }]
  })
  
  if (eepCanceled || !projectPath) return null

  // 2. Select map file
  const { canceled: mapCanceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Source Map File',
    properties: ['openFile'],
    filters: [{ name: 'Starcraft Maps', extensions: ['scx', 'scm'] }]
  })

  if (mapCanceled || filePaths.length === 0) return null

  const mapPath = filePaths[0]
  
  try {
    // 3. Load map data
    const mapData = await loadMapData(mapPath)
    
    // 4. Create initial project Data
    const projectData = {
      version: '1.0',
      mapPath: mapPath,
      projectData: {
        units: {},
        weapons: {},
        upgrades: {},
        images: {}
      }
    }

    // 5. Save project to .eep
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), 'utf-8')

    // Optional: Auto maximize window if not already
    const win = windowEvent ? BrowserWindow.fromWebContents(windowEvent.sender) : null
    if (win && !win.isMaximized()) {
      win.maximize()
    }

    return {
      projectPath,
      projectName: basename(projectPath),
      mapData,
      projectData: projectData.projectData
    }
  } catch (err) {
    console.error('Failed to create project:', err)
    throw new Error('Failed to create project: ' + err)
  }
}

export async function openProject(windowEvent) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open EUD Editor Project',
    properties: ['openFile'],
    filters: [{ name: 'EUD Editor Project', extensions: ['eep'] }]
  })

  if (canceled || filePaths.length === 0) return null

  const projectPath = filePaths[0]

  try {
    const fileContent = fs.readFileSync(projectPath, 'utf-8')
    const parsedData = JSON.parse(fileContent)
    
    const mapPath = parsedData.mapPath
    // Need to handle absolute/relative path or missing map file here
    if (!fs.existsSync(mapPath)) {
        throw new Error(`Linked map file not found at: ${mapPath}`)
    }

    const mapData = await loadMapData(mapPath)
    
    const win = windowEvent ? BrowserWindow.fromWebContents(windowEvent.sender) : null
    if (win && !win.isMaximized()) {
      win.maximize()
    }

    return {
      projectPath,
      projectName: basename(projectPath),
      mapData,
      projectData: parsedData.projectData || { units: {}, weapons: {}, upgrades: {}, images: {} }
    }
  } catch (err) {
    console.error('Failed to open project:', err)
    throw new Error('Failed to open project: ' + err.message)
  }
}

export async function saveProject(projectPath, data) {
  if (!projectPath) return false

  try {
    fs.writeFileSync(projectPath, JSON.stringify({
       version: '1.0',
       mapPath: data.mapPath,
       projectData: data.projectData
    }, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save project:', err)
    throw new Error('Failed to save project: ' + err.message)
  }
}
