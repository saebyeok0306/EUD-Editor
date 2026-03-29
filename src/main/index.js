import { app, shell, BrowserWindow, ipcMain, dialog, Menu, nativeTheme } from 'electron'
import { join, basename } from 'path'
import fs from 'fs'
import scmExtractor from 'scm-extractor'
import bwChkData from 'bw-chk'
const createExtractor = scmExtractor.default || scmExtractor
const BwChk = bwChkData.default || bwChkData
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { extractChkSection, parseUnixSection } from './chkParser.js'
import { getSettings, saveSettings, deleteSettings } from './settings.js'
import { openCASC, closeCASC, readFile, listFiles } from './casc.js'
import { packCascData, readDatapackFile } from './cascPacker.js'
import { setupPortablePath } from './paths.js'
import path from 'path'

// Set up portable data path before anything else
setupPortablePath()


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1140,
    minWidth: 1140,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Open DevTools even in production for debugging
    mainWindow.webContents.openDevTools()
    // Build initial menu (default language: ko)
    buildMenu('ko', mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setLanguage(lang, mainWindow) {
  const isoLabel = lang === 'ko' ? '한국어' : 'English'
  console.log(`[i18n] Language changed to: ${isoLabel}`)

  buildMenu(lang, mainWindow)
  mainWindow.webContents.send('language-changed', lang)
}

function buildMenu(currentLang, mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open SCX/SCM',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu:open-scx')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' }
      ]
    },
    {
      label: 'Language',
      submenu: [
        {
          label: '한국어',
          type: 'radio',
          checked: currentLang === 'ko',
          click: () => setLanguage('ko', mainWindow)
        },
        {
          label: 'English',
          type: 'radio',
          checked: currentLang === 'en',
          click: () => setLanguage('en', mainWindow)
        }
      ]
    },
    {
      label: 'Test',
      submenu: [
        {
          label: 'Delete settings.json',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancel', 'Delete'],
              defaultId: 0,
              title: 'Delete settings.json',
              message: 'Are you sure you want to delete settings.json? The application will be reset and closed.',
            })

            if (response === 1) {
              const success = deleteSettings()
              if (success) {
                app.quit()
              } else {
                dialog.showErrorBox('Error', 'Failed to delete settings.json')
              }
            }
          }
        },
        {
          label: 'Delete casc.datapack',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancel', 'Delete'],
              defaultId: 0,
              title: 'Delete casc.datapack',
              message: 'Are you sure you want to delete casc.datapack? The graphics data will be removed and you will need to setup Starcraft path again.',
            })

            if (response === 1) {
              try {
                const userDataPath = app.getPath('userData')
                const packPath = path.join(userDataPath, 'casc.datapack')
                if (fs.existsSync(packPath)) {
                  fs.unlinkSync(packPath)
                  deleteSettings() // Removing datapack also requires setup reset
                  app.quit()
                } else {
                  dialog.showMessageBox(mainWindow, { type: 'info', message: 'casc.datapack not found.', buttons: ['OK'] })
                }
              } catch (err) {
                dialog.showErrorBox('Error', 'Failed to delete casc.datapack: ' + err.message)
              }
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  nativeTheme.themeSource = 'dark' // Force native UI elements (like select popups) to dark theme

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('dialog:openScx', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Starcraft Maps', extensions: ['scx', 'scm'] }]
    })
    
    if (canceled || filePaths.length === 0) {
      return null
    }

    const filePath = filePaths[0]
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
          const unitSettings = parseUnixSection(unixBuffer)

          const tilesetNames = ['badlands', 'platform', 'install', 'ashworld', 'jungle', 'desert', 'ice', 'twilight']
          const tilesetId = chk.tileset || 0
          const tilesetName = tilesetNames[tilesetId] || 'badlands'

          const win = BrowserWindow.fromWebContents(event.sender)
          if (win && !win.isMaximized()) {
            win.maximize()
          }
          
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
  })

  // StarCraft Path & CASC
  ipcMain.handle('starcraft:getPath', () => {
    return getSettings().starcraftPath || null
  })

  ipcMain.handle('app:readLocalPalette', async (event, name) => {
    try {
      const palettePath = app.isPackaged
        ? path.join(process.resourcesPath, 'Palettes', name)
        : path.join(app.getAppPath(), 'resources', 'Palettes', name)
        
      if (fs.existsSync(palettePath)) {
        return fs.readFileSync(palettePath)
      }
      return null
    } catch (err) {
      console.error('Error reading local palette:', err)
      return null
    }
  })

  ipcMain.handle('read-unit-preview', (event, unitId) => {
    try {
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, 'unit_previews', `${unitId}.webp`)
      if (fs.existsSync(filePath)) {
        // Return file URL for display
        return `file://${filePath}`
      }
      return null
    } catch (err) {
      console.error('Error reading unit preview:', err)
      return null
    }
  })

  ipcMain.handle('starcraft:listFiles', async (_, scPath, mask) => {
    try {
      const hStorage = openCASC(scPath)
      if (!hStorage) return []
      const list = listFiles(hStorage, mask)
      closeCASC(hStorage)
      return list
    } catch (err) {
      console.error('[CASC] List files error:', err)
      return []
    }
  })


  ipcMain.handle('app:getDatapackFile', (event, internalPath) => {
    try {
      const userDataPath = app.getPath('userData')
      const packPath = path.join(userDataPath, 'casc.datapack')
      return readDatapackFile(packPath, internalPath)
    } catch (err) {
      console.error('Failed to read datapack file:', err)
      return null
    }
  })

  ipcMain.handle('app:saveUnitPreview', async (event, { unitId, dataUrl }) => {
    try {
      const userDataPath = app.getPath('userData')
      const previewsPath = path.join(userDataPath, 'unit_previews')
      if (!fs.existsSync(previewsPath)) {
        fs.mkdirSync(previewsPath, { recursive: true })
      }

      const base64Data = dataUrl.replace(/^data:image\/webp;base64,/, '')
      const filePath = path.join(previewsPath, `${unitId}.webp`)
      fs.writeFileSync(filePath, base64Data, 'base64')
      return true
    } catch (err) {
      console.error('[Main] Failed to save unit preview:', err)
      return false
    }
  })

  ipcMain.handle('app:getUnitPreviewUrl', async (event, unitId) => {
    try {
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, 'unit_previews', `${unitId}.webp`)
      if (fs.existsSync(filePath)) {
        // Return file URL for the renderer
        return `file://${filePath}`
      }
      return null
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('app:saveImagePreview', async (event, { imageId, dataUrl }) => {
    try {
      const userDataPath = app.getPath('userData')
      const previewsPath = path.join(userDataPath, 'image_previews')
      if (!fs.existsSync(previewsPath)) {
        fs.mkdirSync(previewsPath, { recursive: true })
      }

      const base64Data = dataUrl.replace(/^data:image\/webp;base64,/, '')
      const filePath = path.join(previewsPath, `${imageId}.webp`)
      fs.writeFileSync(filePath, base64Data, 'base64')
      return true
    } catch (err) {
      console.error('[Main] Failed to save image preview:', err)
      return false
    }
  })

  ipcMain.handle('app:getImagePreviewUrl', async (event, imageId) => {
    try {
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, 'image_previews', `${imageId}.webp`)
      if (fs.existsSync(filePath)) {
        // Return file URL for the renderer
        return `file://${filePath}`
      }
      return null
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('app:getUserDataPath', () => {
    return app.getPath('userData')
  })

  ipcMain.handle('read-images-tbl', () => {
    try {
      const userDataPath = app.getPath('userData')
      const packPath = path.join(userDataPath, 'casc.datapack')
      const buffer = readDatapackFile(packPath, 'arr/images.tbl')
      // Let renderer do the TBL parsing, or parse it here.
      // Easiest is to send buffer to renderer.
      return buffer
    } catch (err) {
      console.error('Failed to read images.tbl:', err)
      return null
    }
  })

  ipcMain.handle('starcraft:getFile', async (_, scPath, fileName) => {
    console.log(`[CASC] Requesting file: ${fileName} from ${scPath}`)
    try {
      const hStorage = openCASC(scPath)
      if (!hStorage) {
        console.warn('[CASC] Failed to open storage (returned null)')
        return null
      }
      const content = readFile(hStorage, fileName)
      closeCASC(hStorage)
      
      if (!content) {
        console.warn(`[CASC] File not found or failed to read: ${fileName}`)
      } else {
        console.log(`[CASC] Successfully read ${fileName} (${content.length} bytes)`)
      }
      
      return content
    } catch (err) {
      console.error('[CASC] Error in getFile:', err.message)
      return null
    }
  })

  ipcMain.handle('starcraft:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'StarCraft Executable', extensions: ['exe'] }],
      title: 'Select StarCraft.exe'
    })
    
    if (canceled || filePaths.length === 0) return null
    // Return the directory containing the .exe
    return path.dirname(filePaths[0])
  })

  ipcMain.handle('starcraft:extract', async (event, scPath) => {
    saveSettings({ starcraftPath: scPath })
    
    try {
      const userDataPath = app.getPath('userData')
      const packPath = path.join(userDataPath, 'casc.datapack')
      
      const onProgress = (p) => {
        event.sender.send('starcraft:extract-progress', p)
      }
      
      await packCascData(scPath, packPath, onProgress)
      
      return { success: true }
    } catch (err) {
      console.error('Extraction error:', err)
      return { success: false, error: err.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
