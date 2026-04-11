import React, { useState, useEffect } from 'react'

export default function SetupScreen({ onCompleted }) {
  const [scPath, setScPath] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, currentFile: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const removeListener = window.api.onExtractProgress((p) => {
      setProgress(p)
    })
    return () => {
      removeListener()
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

    try {
      // 1. Extract base assets
      await window.api.extractStarcraftGraphics(scPath)


      setExtracting(false)
      onCompleted(scPath)
    } catch (err) {
      console.error('Setup error:', err)
      setError('Setup failed: ' + err.message)
      setExtracting(false)
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
          To start editing, we need to locate your StarCraft Launcher.exe and extract essential graphics.
        </p>

        {!extracting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={scPath}
                readOnly
                placeholder="Select StarCraft Launcher.exe..."
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


            {error && <p style={{ color: '#ff6b6b', fontSize: '0.9em' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleStartExtraction}
                disabled={!scPath}
                style={{
                  flex: 1,
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
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p style={{ marginBottom: '10px', color: 'var(--ev-c-text-1)' }}>
              Extracting Graphics...
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
