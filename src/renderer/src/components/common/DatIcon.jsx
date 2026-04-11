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

        // 1) Render to offscreen canvas
        const offscreen = document.createElement('canvas')
        offscreen.width = decoded.width
        offscreen.height = decoded.height
        const offCtx = offscreen.getContext('2d')
        renderToCanvas(offCtx, decoded, palette)

        // 2) Find non-transparent bounding box
        const imageData = offCtx.getImageData(0, 0, decoded.width, decoded.height)
        const pixels = imageData.data
        let minX = decoded.width, minY = decoded.height, maxX = 0, maxY = 0
        let hasVisiblePixels = false

        for (let y = 0; y < decoded.height; y++) {
          for (let x = 0; x < decoded.width; x++) {
            const a = pixels[(y * decoded.width + x) * 4 + 3]
            if (a > 0) {
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
              hasVisiblePixels = true
            }
          }
        }

        // 3) Draw content region centered into fixed size canvas
        canvasRef.current.width = size
        canvasRef.current.height = size
        ctx.clearRect(0, 0, size, size)

        if (hasVisiblePixels) {
          const contentW = maxX - minX + 1
          const contentH = maxY - minY + 1
          const scale = Math.min(size / contentW, size / contentH, 1)
          const drawW = Math.round(contentW * scale)
          const drawH = Math.round(contentH * scale)
          const destX = Math.round((size - drawW) / 2)
          const destY = Math.round((size - drawH) / 2)
          ctx.drawImage(offscreen, minX, minY, contentW, contentH, destX, destY, drawW, drawH)
        }

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
            display: loading ? 'none' : 'block'
          }}
        />
      )}
    </div>
  )
}
