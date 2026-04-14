import React, { useEffect, useState, useRef } from 'react'

export default function BuildWindow() {
  const [logs, setLogs] = useState([])
  const [isBuilding, setIsBuilding] = useState(true)
  const [countdown, setCountdown] = useState(null)
  const logContainerRef = useRef(null)

  useEffect(() => {
    // Inject strict CSS overrides to defeat main.css desktop constraints
    const style = document.createElement('style')
    style.innerHTML = `
      html, body, #root { 
        min-width: 0 !important; 
        min-height: 0 !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        overflow: hidden !important;
      }
      * {
        -webkit-app-region: no-drag;
      }
      
      /* Make scrollbar much thicker and easier to click */
      ::-webkit-scrollbar {
        width: 18px !important;
        height: 18px !important;
      }
      ::-webkit-scrollbar-track {
        background: #1a1a1a !important;
      }
      ::-webkit-scrollbar-thumb {
        background: #666 !important;
        border-radius: 9px !important;
        border: 4px solid #1a1a1a !important;
        background-clip: content-box !important;
        min-height: 50px !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #888 !important;
      }
      
      @keyframes evSlideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    // Listen for build logs
    const removeListener = window.api.onBuildLog((logObj) => {
      setLogs((prev) => [...prev, logObj])
      if (logObj.type === 'success') {
        setIsBuilding(false)
        setCountdown(5)
      } else if (logObj.type === 'error') {
        setIsBuilding(false)
      }
    })
    return () => removeListener()
  }, [])

  useEffect(() => {
    if (countdown !== null) {
      if (countdown <= 0) {
        window.api.close()
        return
      }
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    const handleActivity = () => {
      setCountdown((prev) => {
        if (prev !== null && prev < 5) return 5
        return prev
      })
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('wheel', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('wheel', handleActivity)
    }
  }, [])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ff4d4f'
      case 'success': return '#52c41a'
      case 'info': return '#1890ff'
      case 'stderr': return '#faad14'
      case 'stdout': return '#d9d9d9'
      default: return '#d9d9d9'
    }
  }

  const handleClose = () => {
    window.api.close()
  }

  return (
    <div style={{ 
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', 
      background: 'var(--color-bg-main)', 
      overflow: 'hidden' 
    }}>
      {/* Draggable Title Area for Frameless Window */}
      <div 
        style={{ 
          WebkitAppRegion: 'drag', 
          padding: '12px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-sidebar)',
          flexShrink: 0
        }}
      >
        <h2 style={{ margin: 0, fontSize: '14px', color: 'var(--ev-c-text-1)', fontWeight: 'bold' }}>
          EUD Editor Build {isBuilding && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--ev-c-text-3)' }}>(Building...)</span>}
        </h2>
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={handleClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--ev-c-text-2)', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Log Output Area */}
      <div 
        ref={logContainerRef}
        style={{ 
          flex: 1,
          padding: '16px', 
          overflowY: 'auto', 
          background: '#0a0a0a', 
          fontFamily: 'Consolas, Courier New, monospace',
          fontSize: '13px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}
      >
        {logs.map((log, index) => (
          <span key={index} style={{ color: getLogColor(log.type) }}>
            {log.text}
          </span>
        ))}
        {logs.length === 0 && <span style={{ color: '#d9d9d9' }}>Preparing build environment...</span>}
      </div>

      {countdown !== null && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(76, 175, 80, 0.15)',
          borderTop: '1px solid rgba(76, 175, 80, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          animation: 'evSlideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CAF50' }}>빌드 성공</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {countdown}초 후 자동으로 창이 닫힙니다.
              </div>
            </div>
          </div>
          <button 
            onClick={handleClose}
            style={{
              WebkitAppRegion: 'no-drag',
              padding: '6px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#45a049'}
            onMouseOut={(e) => e.target.style.background = '#4CAF50'}
          >
            지금 닫기
          </button>
        </div>
      )}
    </div>
  )
}
