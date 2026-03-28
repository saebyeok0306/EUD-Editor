import React, { useState, useEffect, useRef } from 'react'
import { decodeGRP, renderToCanvas, PLAYER_COLORS } from '../utils/grpDecoder'
import { generateAllUnitPreviews } from '../utils/previewGenerator'

export default function SetupScreen({ onCompleted }) {
  const [scPath, setScPath] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, currentFile: '' })
  const [phase, setPhase] = useState('extract') // 'extract' or 'previews'
  const [error, setError] = useState('')
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [fileList, setFileList] = useState([])
  const [listMask, setListMask] = useState('SD/*')
  const [testFileName, setTestFileName] = useState('unit/terran/spider.grp')
  const [playerColor, setPlayerColor] = useState('Red')
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const removeListener = window.api.onExtractProgress((p) => {
      setProgress(p)
    })
    return () => {
      removeListener()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.api.selectStarcraftFolder()
    if (path) {
      setScPath(path)
      setError('')
    }
  }

  const handleStartExtraction = async () => {
    if (!scPath) {
      setError('Please select StarCraft folder first.')
      return
    }

    setExtracting(true)
    setError('')
    setPhase('extract')

    try {
      // 1. Extract base assets
      await window.api.extractStarcraftGraphics(scPath)

      // 2. Generate unit previews for optimization
      setPhase('previews')
      setProgress({ percent: 0, currentFile: 'Initializing preview generation...' })
      
      await generateAllUnitPreviews((p) => {
        setProgress(p)
      })

      setExtracting(false)
      onCompleted(scPath)
    } catch (err) {
      console.error('Setup error:', err)
      setError('Setup failed: ' + err.message)
      setExtracting(false)
    }
  }

  const handleTestPreview = async () => {
    if (!scPath) return
    setError('')
    try {
      // Use scPath for the CASC storage, and testFileName for the specific file
      const iconBuffer = await window.api.getStarcraftFile(scPath, testFileName)

      // Try standard PCX for unit palette directly from CASC
      let palBuffer = null
      try {
        const pcxBuffer = await window.api.getStarcraftFile(scPath, 'game/tunit.pcx')
        if (pcxBuffer && pcxBuffer.byteLength > 768) {
          // In PCX, the 256-color palette (768 bytes) is at the very end of the file, preceded by 0x0C.
          const paletteData = new Uint8Array(pcxBuffer.buffer, pcxBuffer.byteOffset + pcxBuffer.byteLength - 768, 768)
          palBuffer = paletteData
        } else {
          // Fallback to local
          palBuffer = await window.api.readLocalPalette('badlands.wpe')
        }
      } catch (e) {
        console.warn('Could not load PCX palette:', e)
      }

      if (!iconBuffer) {
        setError('Failed to load GRP file from CASC.')
        return
      }

      const firstFrame = decodeGRP(iconBuffer, 0) // Frame 0
      if (!firstFrame) {
        setError('Failed to decode GRP file.')
        return
      }

      const frameCount = firstFrame.frameCount || 1
      let currentFrame = 0

      const renderFrame = (fIdx) => {
        try {
          const decoded = decodeGRP(iconBuffer, fIdx)
          if (!decoded) return
          const ctx = canvasRef.current.getContext('2d')
          canvasRef.current.width = decoded.width
          canvasRef.current.height = decoded.height
          renderToCanvas(ctx, decoded, palBuffer, PLAYER_COLORS[playerColor])
        } catch (e) {
          console.error(`Failed to render frame ${fIdx}:`, e)
        }
      }

      renderFrame(0)
      setPreviewLoaded(true)

      if (intervalRef.current) clearInterval(intervalRef.current)

      if (frameCount > 1) {
        intervalRef.current = setInterval(() => {
          currentFrame = (currentFrame + 1) % frameCount
          renderFrame(currentFrame)
        }, 100) // 1 second per frame as requested
      }

    } catch (err) {
      console.error('Preview error:', err)
      setError('Error rendering preview: ' + err.message)
    }
  }

  const handleListFiles = async () => {
    if (!scPath) return
    setError('')
    try {
      const list = await window.api.listStarcraftFiles(scPath, listMask)
      setFileList(list)
    } catch (err) {
      setError('Error listing files: ' + err.message)
    }
  }

  return (
    <div className="setup-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-background-soft)',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{ marginBottom: '20px', color: 'var(--ev-c-brand)' }}>Welcome to EUD Editor</h1>
        <p style={{ marginBottom: '40px', color: 'var(--ev-c-text-2)' }}>
          To start editing, we need to locate your StarCraft.exe and extract essential SD graphics.
        </p>

        {!extracting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={scPath}
                readOnly
                placeholder="Select StarCraft.exe..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--ev-c-divider)',
                  backgroundColor: 'var(--ev-c-black-mute)',
                  color: 'var(--ev-c-text-1)'
                }}
              />
              <button
                onClick={handleSelectFolder}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ev-c-gray-3)',
                  color: 'var(--ev-c-text-1)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Select File
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '0.75em', marginBottom: '5px', color: 'var(--ev-c-text-3)', textAlign: 'left' }}>Test Internal Path:</p>
              <input
                type="text"
                value={testFileName}
                onChange={(e) => setTestFileName(e.target.value)}
                placeholder="Internal Path (e.g. SD/unit/cmdbtns/cmdbuttons.grp)"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.8em',
                  borderRadius: '4px',
                  border: '1px solid var(--ev-c-divider)',
                  backgroundColor: 'transparent',
                  color: 'var(--ev-c-text-1)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                value={listMask}
                onChange={(e) => setListMask(e.target.value)}
                placeholder="File Mask (e.g. SD/*)"
                style={{ flex: 1, padding: '8px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid var(--ev-c-divider)', backgroundColor: 'transparent', color: 'var(--ev-c-text-1)' }}
              />
              <button
                onClick={handleListFiles}
                disabled={!scPath}
                style={{ padding: '8px 15px', borderRadius: '4px', backgroundColor: 'var(--ev-c-gray-3)', color: 'var(--ev-c-text-1)', fontSize: '0.8em', border: 'none', cursor: 'pointer' }}
              >
                List Files
              </button>
            </div>

            {fileList.length > 0 && (
              <div style={{
                marginTop: '10px',
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'left',
                fontSize: '0.75em',
                fontFamily: 'monospace',
                color: 'var(--ev-c-text-2)'
              }}>
                {fileList.map((f, i) => (
                  <div
                    key={i}
                    onClick={() => setTestFileName(f)}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: testFileName === f ? 'var(--ev-c-brand)' : 'inherit'
                    }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}

            {error && <p style={{ color: '#ff6b6b', fontSize: '0.9em' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={handleStartExtraction}
                disabled={!scPath}
                style={{
                  flex: 2,
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: scPath ? 'var(--ev-c-brand)' : 'var(--ev-c-gray-2)',
                  color: '#fff',
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: scPath ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                Start Setup
              </button>

              <button
                onClick={handleTestPreview}
                disabled={!scPath}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ev-c-gray-3)',
                  color: 'var(--ev-c-text-1)',
                  fontSize: '0.9em',
                  border: 'none',
                  cursor: scPath ? 'pointer' : 'not-allowed'
                }}
              >
                Test Preview
              </button>
            </div>

            {/* Preview Area */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              display: previewLoaded ? 'block' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <p style={{ fontSize: '0.8em', color: 'var(--ev-c-text-3)' }}>Test Extraction Preview (Animated):</p>
                <select
                  value={playerColor}
                  onChange={(e) => setPlayerColor(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'var(--ev-c-gray-3)',
                    color: 'var(--ev-c-text-1)',
                    border: '1px solid var(--ev-c-divider)',
                    borderRadius: '4px'
                  }}
                >
                  {Object.keys(PLAYER_COLORS).map(color => (
                    <option key={color} value={color}>{color} Player</option>
                  ))}
                </select>
              </div>
              <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', transform: 'scale(2)', transformOrigin: 'top center' }}></canvas>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p style={{ marginBottom: '10px', color: 'var(--ev-c-text-1)' }}>
              {phase === 'extract' ? 'Extracting Graphics...' : 'Generating Unit Previews...'}
            </p>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: 'var(--ev-c-gray-3)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '15px'
            }}>
              <div style={{
                width: `${progress.percent}%`,
                height: '100%',
                backgroundColor: 'var(--ev-c-brand)',
                transition: 'width 0.3s'
              }}></div>
            </div>
            <p style={{ fontSize: '0.85em', color: 'var(--ev-c-text-3)' }}>{progress.currentFile}</p>
          </div>
        )}
      </div>
    </div>
  )
}
