import React, { useState, useCallback, useRef } from 'react'
import ImageGraphic from '../../common/ImageGraphic'

const GraphicRenderer = React.memo(({ imageId, tileset, selectedAnimation, autoCrop, customData }) => {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [direction, setDirection] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const [restartKey, setRestartKey] = useState(0)
  const graphicRef = useRef(null)

  const handleReplay = useCallback(() => {
    setRestartKey(k => k + 1)
    if (!isPlaying) setIsPlaying(true)
  }, [isPlaying])

  const handleStep = useCallback((delta) => {
    if (isPlaying) setIsPlaying(false)
    if (graphicRef.current) graphicRef.current.stepFrame(delta)
  }, [isPlaying])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--ev-c-divider)' }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)', backgroundImage: 'radial-gradient(var(--ev-c-divider) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '10px 10px', minHeight: '200px', padding: '20px' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handleStep(-1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="이전 시퀀스 (-1)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button
              onClick={() => handleStep(1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="다음 시퀀스 (+1)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
            <button
              onClick={handleReplay}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              title="처음부터 다시 재생"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.65 6.35A7.95 7.95 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
            </button>
          </div>

          <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid var(--ev-c-divider)', color: 'var(--ev-c-text-1)', borderRadius: '4px', fontSize: '11px', padding: '4px', cursor: 'pointer', outline: 'none' }}>
            <option value={0.01}>0.01x</option>
            <option value={0.05}>0.05x</option>
            <option value={0.1}>0.1x</option>
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x (기본)</option>
          </select>

          <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--ev-c-divider)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: 'var(--ev-c-text-2)', fontSize: '11px' }}>FRAME</span>
            <span style={{ color: 'var(--ev-c-brand)', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>{currentFrame.toString().padStart(4, '0')}</span>
          </div>
        </div>
        <ImageGraphic
          ref={graphicRef}
          imageId={imageId}
          tileset={tileset}
          animate={true}
          animationName={selectedAnimation}
          direction={direction}
          onFrameChange={setCurrentFrame}
          maxWidth={300}
          maxHeight={300}
          autoCrop={autoCrop}
          playerColor="Red"
          customData={customData}
          playbackSpeed={playbackSpeed}
          paused={!isPlaying}
          onAnimationEnd={() => setIsPlaying(false)}
          restartKey={restartKey}
        />
      </div>
      {autoCrop && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--ev-c-bg)', borderTop: '1px solid var(--ev-c-divider)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: 'var(--ev-c-text-2)', fontSize: '13px' }}>방향:</span>
          <input type="range" min="0" max="31" value={direction} onChange={(e) => setDirection(parseInt(e.target.value, 10))} style={{ flex: 1, margin: 0, accentColor: 'var(--ev-c-brand)', cursor: 'pointer' }} />
          <span style={{ color: 'var(--ev-c-text-1)', fontFamily: 'monospace', fontSize: '14px', width: '20px', textAlign: 'right' }}>{direction}</span>
        </div>
      )}
    </div>
  )
})

export default GraphicRenderer
