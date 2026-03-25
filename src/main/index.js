import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join, basename } from 'path'
import fs from 'fs'
import scmExtractor from 'scm-extractor'
import bwChkData from 'bw-chk'
const createExtractor = scmExtractor.default || scmExtractor
const BwChk = bwChkData.default || bwChkData
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { extractChkSection, parseUnixSection } from './chkParser.js'
import { getSettings, saveSettings } from './settings.js'
import { openCASC, closeCASC, readFile, listFiles } from './casc.js'
import path from 'path'


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
      label: '언어 선택 (Language)',
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

  ipcMain.handle('app:readLocalPalette', (event, filename) => {
    const palPath = path.join(app.getAppPath(), 'resources', 'Palletes', filename)
    if (fs.existsSync(palPath)) {
      return fs.readFileSync(palPath)
    }
    return null
  })

  ipcMain.handle('app:saveUnitImage', (event, unitId, base64Data) => {
    try {
      const userDataPath = app.getPath('userData')
      const imagesPath = path.join(userDataPath, 'cache', 'images')
      if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath, { recursive: true })
      
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      const filePath = path.join(imagesPath, `${unitId}.webp`)
      fs.writeFileSync(filePath, buffer)
      return { success: true, path: filePath }
    } catch (err) {
      console.error('Failed to save image:', err)
      return { success: false, error: err.message }
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
      const hStorage = openCASC(scPath)
      
      // key common SD assets in SC:R
      const filesToExtract = [
        'unit/terran/spider.grp', // Some palettes
        // ... in a full implementation, we'd have hundreds of files
      ]

      const userDataPath = app.getPath('userData')
      const cachePath = path.join(userDataPath, 'cache', 'sd')
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true })
      
      for (let i = 0; i < filesToExtract.length; i++) {
        const fileName = filesToExtract[i]
        event.sender.send('starcraft:extract-progress', { 
          percent: Math.round(((i + 1) / filesToExtract.length) * 100), 
          currentFile: `Extracting ${fileName}...` 
        })

        const content = readFile(hStorage, fileName)
        if (content) {
          const targetPath = path.join(cachePath, fileName.replace(/\//g, '_'))
          fs.writeFileSync(targetPath, content)
        }
      }
      
      closeCASC(hStorage)
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
