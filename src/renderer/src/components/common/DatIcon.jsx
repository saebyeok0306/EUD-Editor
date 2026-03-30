import { useState, useEffect, useRef } from 'react'
import { decodeGRP, renderToCanvas } from '../../utils/grpDecoder'
import { loadPalette } from '../../utils/paletteLoader'

const graphicCache = new Map()

export default function DatIcon({
  frameIndex,
  grfPath = 'unit/cmdicons/cmdicons.grp',
  size = 36,
  style = {},
  className = ''
}) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadIcon() {
      if (frameIndex === null || frameIndex === undefined) {
        if (canvasRef.current) {
          canvasRef.current.width = 0
          canvasRef.current.height = 0
        }
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Load GRP
        let grpBuffer = graphicCache.get(grfPath)
        if (!grpBuffer) {
          grpBuffer = await window.api.getDatapackFile(grfPath)
          if (grpBuffer) graphicCache.set(grfPath, grpBuffer)
        }

        if (!active || !grpBuffer) {
          if (!grpBuffer && active) setError('GRP not found')
          return
        }

        // Load Palette (Icons usually use ticon.pcx or similar)
        const palette = await loadPalette('cmdicons')

        const decoded = decodeGRP(grpBuffer, frameIndex)
        if (!active || !decoded) return

        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        canvasRef.current.width = decoded.width
        canvasRef.current.height = decoded.height
        renderToCanvas(ctx, decoded, palette)

        setLoading(false)
      } catch (err) {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    loadIcon()
    return () => { active = false }
  }, [frameIndex, grfPath])

  if (frameIndex === null || frameIndex === undefined || frameIndex >= 65535) {
    return null
  }

  return (
    <div
      className={`dat-icon-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid var(--ev-c-divider)',
        position: 'relative',
        ...style
      }}
    >
      {loading && <div style={{ fontSize: '8px', opacity: 0.5 }}>...</div>}
      {error ? (
        <div title={error} style={{ fontSize: '8px', color: 'var(--ev-c-red)' }}>!</div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            display: loading ? 'none' : 'block'
          }}
        />
      )}
    </div>
  )
}
