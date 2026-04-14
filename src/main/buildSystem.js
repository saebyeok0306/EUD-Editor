import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { getSettings } from './settings.js'
import { BrowserWindow, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import { generateEdpFile } from './build/generateEdpFile.js'
import { generateEpsFile } from './build/generateEpsFile.js'
import { generateEEData } from './build/generateEEData.js'

export async function buildProject(event, projectPath, data, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const settings = getSettings()
      const euddraftPath = settings.euddraftPath

      const parentWin = BrowserWindow.fromWebContents(event.sender)

      if (!euddraftPath || !fs.existsSync(euddraftPath)) {
        dialog.showErrorBox('Error', 'euddraft 경로가 설정되지 않았거나 올바르지 않습니다. 환경설정을 확인해주세요.')
        resolve({ success: false, error: 'euddraft path not set' })
        return
      }

      if (!options.outputMap) {
        dialog.showMessageBoxSync(parentWin, {
          type: 'warning',
          title: 'Build Cancelled',
          message: '빌드 결과 맵 경로(Output Map)가 설정되어 있지 않습니다.\n설정의 "프로젝트 설정" 탭에서 빌드 결과 맵 경로를 지정해주세요.'
        })
        resolve({ success: false, error: 'Output map path not set' })
        return
      }

      const mapPath = options.inputMap || (data.mapPath ? data.mapPath : '')
      const outputPath = options.outputMap

      if (!mapPath || !fs.existsSync(mapPath)) {
        dialog.showErrorBox('Error', `Input map not found: ${mapPath}`)
        resolve({ success: false, error: 'Input map not found' })
        return
      }

      // Create new BrowserWindow for build logs
      const buildWin = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'EUD Editor Build',
        frame: false,
        backgroundColor: '#0a0a0a',
        parent: parentWin,
        modal: false,
        webPreferences: {
          preload: path.join(__dirname, '../preload/index.js'),
          sandbox: false,
          webSecurity: false
        }
      })

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        buildWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/build')
      } else {
        buildWin.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'build' })
      }

      const sendLog = (type, text) => {
        if (!buildWin.isDestroyed()) {
          buildWin.webContents.send('build:log', { type, text })
        }
      }

      let euddraftProcess = null
      let isFinished = false

      buildWin.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          const buildDir = path.join(path.dirname(projectPath), 'build')
          const configDir = path.join(buildDir, '.eudeditor')
          if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true })
          }
          if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
          }

          sendLog('info', '================ EUD Editor Build =================\n')
          sendLog('info', `Project: ${path.basename(projectPath)}\n`)
          sendLog('info', `Build Directory: ${buildDir}\n\n`)

          // 1. Generate EDD and EDS files
          generateEdpFile(buildDir, mapPath, outputPath)
          sendLog('info', '> Generated build.edd & build.eds\n')
          
          // 2. Generate main.eps
          generateEpsFile(buildDir)
          sendLog('info', '> Generated main.eps\n')
          
          // 3. Generate EEData.py
          generateEEData(buildDir, data)
          sendLog('info', '> Generated EEData.py\n')

          // 3. Execute euddraft.exe
          sendLog('info', `\n> euddraft.exe .eudeditor/build.eds 실행중...\n`)
          euddraftProcess = spawn(euddraftPath, ['.eudeditor/build.eds'], {
            cwd: buildDir
          })

          euddraftProcess.stdout.on('data', (out) => {
            const text = out.toString()
            sendLog('stdout', text)
            
            // Bypass euddraft's system("pause") behavior which hangs the spawned process
            if (text.toLowerCase().includes('press any key') || text.includes('계속해려면 아무 키나') || text.includes('계속하려면 아무 키나')) {
              try {
                euddraftProcess.stdin.write('\r\n')
              } catch (e) {
                // ignore
              }
            }

          })

          euddraftProcess.stderr.on('data', (errBox) => {
            sendLog('stderr', errBox.toString())
          })

          euddraftProcess.on('close', (code) => {
            if (isFinished) return
            isFinished = true
            
            if (code === 0 || code === null) {
              sendLog('success', `\n빌드가 성공적으로 완료되었습니다. (Output: ${outputPath})\n`)
              resolve({ success: true, outputPath })
            } else {
              sendLog('error', `\n빌드 실패 (코드: ${code}). 로그를 확인해주세요.\n`)
              resolve({ success: false, error: `Process exited with code ${code}` })
            }
          })
          
          euddraftProcess.on('error', (err) => {
            sendLog('error', `\neuddraft 실행 오류: ${err.message}\n`)
            resolve({ success: false, error: err.message })
          })

        }, 500)
      })

      buildWin.on('closed', () => {
        if (euddraftProcess) {
          euddraftProcess.kill()
        }
      })

    } catch (err) {
      console.error('Build process error:', err)
      dialog.showErrorBox('Build error', err.message)
      resolve({ success: false, error: err.message })
    }
  })
}
