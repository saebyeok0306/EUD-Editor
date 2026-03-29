import { useState, useEffect, useRef } from 'react'
import { getUnitsData, getFlingyData, getSpritesData, getImagesData, getImagesTbl } from '../../utils/datStore'
import { decodeGRP, renderToCanvas, PLAYER_COLORS } from '../../utils/grpDecoder'
import { IScriptParser, OPCODES } from '../../utils/iscriptParser'
import iscriptJsonUrl from '../../data/iscript_data.json?url'
import { loadPalette } from '../../utils/paletteLoader'

let sharedIscriptData = null
const graphicCache = new Map()

export default function UnitGraphic({ unitId, playerColor = 'Red', tileset = 'badlands', maxWidth = 64, maxHeight = 64, autoCrop = false, style = {}, onDebugInfo, animate = false }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let active = true
    let timer = null

    async function loadGraphic() {
      if (unitId === null || unitId === undefined) return

      try {
        setLoading(true)
        setErrorMsg('')

        const unitsData = getUnitsData()
        if (!unitsData || !unitsData[unitId]) throw new Error('Unit data not found.')

        const flingyId = unitsData[unitId]['Graphics']
        const flingyData = getFlingyData()
        const spritesData = getSpritesData()
        const imagesData = getImagesData()
        const imagesTbl = getImagesTbl()

        if (!flingyData?.[flingyId] || !spritesData?.[flingyData[flingyId]['Sprite']]) {
          throw new Error('Data structure incomplete for unit: ' + unitId)
        }

        const spriteId = flingyData[flingyId]['Sprite']
        const imageId = spritesData[spriteId]['Image File']
        if (!imagesData?.[imageId]) throw new Error('Image data not found for ID: ' + imageId)

        let targetPath = imagesTbl[imagesData[imageId]['GRP File'] - 1]
        if (!targetPath) throw new Error('images.tbl path not found')

        targetPath = targetPath.replace(/\\/g, '/').replace(/^SD\//i, '').replace(/^SD\\/i, '')
        if (!targetPath.toLowerCase().startsWith('unit/')) targetPath = 'unit/' + targetPath
        targetPath = targetPath.replace(/\.[^/.]+$/, "") + ".grp"

        if (onDebugInfo) onDebugInfo({ flingyId, imageId, path: targetPath })

        const paletteToUse = await loadPalette(targetPath, tileset)

        // Load JSON Iscript
        if (animate && !sharedIscriptData) {
          try {
            const response = await fetch(iscriptJsonUrl)
            if (response.ok) {
              sharedIscriptData = await response.json()
              console.log('[UnitGraphic] iscript_data.json loaded successfully')
            }
          } catch (e) {
            console.error('[UnitGraphic] iscript_data.json load failed:', e)
          }
        }

        let grpBuffer = graphicCache.get(targetPath)
        if (!grpBuffer) {
          grpBuffer = await window.api.getDatapackFile(targetPath)
          if (grpBuffer) graphicCache.set(targetPath, grpBuffer)
        }

        if (!active || !grpBuffer) return

        const finalCtx = canvasRef.current?.getContext('2d')
        if (!finalCtx) return

        const iscriptId = imagesData[imageId]['Iscript ID'] & 0xFFFF

        let currentScript = null
        let scriptIndex = 0

        if (animate && sharedIscriptData) {
          const header = sharedIscriptData.headers.find(h => h.is_id === iscriptId)
          if (header) {
            const entryPoint = header.entry_points.Walking || header.entry_points.Init
            if (entryPoint && sharedIscriptData.labels[entryPoint]) {
              currentScript = entryPoint
              console.log(`[UnitGraphic] Starting animation from label: ${entryPoint} for ID: ${iscriptId}`)
            }
          }
        }

        const renderFrame = (fIdx) => {
          if (!active || !grpBuffer || !canvasRef.current) return
          const frameData = decodeGRP(grpBuffer, fIdx)
          if (!frameData) return

          let cropWidth = frameData.width, cropHeight = frameData.height, offsetX = 0, offsetY = 0
          if (autoCrop) {
            let minX = frameData.width, minY = frameData.height, maxX = 0, maxY = 0
            const pixels = frameData.data
            for (let y = 0; y < frameData.height; y++) {
              for (let x = 0; x < frameData.width; x++) {
                if (pixels[y * frameData.width + x] !== 0) {
                  if (x < minX) minX = x; if (y < minY) minY = y
                  if (x > maxX) maxX = x; if (y > maxY) maxY = y
                }
              }
            }
            if (minX <= maxX && minY <= maxY) {
              cropWidth = maxX - minX + 1; cropHeight = maxY - minY + 1
              offsetX = minX; offsetY = minY
            }
          }

          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = frameData.width
          tempCanvas.height = frameData.height
          renderToCanvas(tempCanvas.getContext('2d'), frameData, paletteToUse, PLAYER_COLORS[playerColor])

          canvasRef.current.width = cropWidth
          canvasRef.current.height = cropHeight
          finalCtx.clearRect(0, 0, cropWidth, cropHeight)
          finalCtx.drawImage(tempCanvas, offsetX, offsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        }

        renderFrame(0)

        // Animation loop
        if (animate && currentScript) {
          const loop = () => {
            if (!active) return

            let waitTicks = 0
            while (waitTicks === 0 && currentScript) {
              const script = sharedIscriptData.labels[currentScript]
              if (!script || scriptIndex >= script.length) break

              const instr = script[scriptIndex]
              const { opcode, args } = instr

              if (opcode === 'playfram') {
                const fIdx = parseInt(args[0], args[0].startsWith('0x') ? 16 : 10)
                renderFrame(fIdx)
                scriptIndex++
              } else if (opcode === 'wait') {
                waitTicks = parseInt(args[0]) || 1
                scriptIndex++
              } else if (opcode === 'goto') {
                const targetLabel = args[0]
                if (sharedIscriptData.labels[targetLabel]) {
                  currentScript = targetLabel
                  scriptIndex = 0
                } else {
                  currentScript = null // Stop on unknown label
                }
              } else if (opcode === 'gotorepeatattk') {
                // Common SC opcode: repeat current label? 
                scriptIndex = 0
              } else if (opcode === 'end') {
                currentScript = null
              } else {
                scriptIndex++ // Skip unknown opcodes
              }
            }

            if (waitTicks > 0 && active) {
              timer = setTimeout(loop, waitTicks * (1000 / 18))
            }
          }
          loop()
        }

      } catch (err) {
        console.error('[UnitGraphic] Error loading unit graphic:', err)
        if (active) setErrorMsg(`[L${unitId}] ${err.message}`)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadGraphic()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [unitId, playerColor, autoCrop, animate])

  return (
    <div style={{
      width: maxWidth,
      height: maxHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      ...style
    }}>
      {errorMsg ? (
        <div title={errorMsg} style={{ color: '#ff6b6b', fontSize: '9px', textAlign: 'center', padding: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {errorMsg}
        </div>
      ) : (
        <>
          {loading && <div style={{ color: '#aaa', fontSize: '10px' }}>Loading...</div>}
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              display: loading ? 'none' : 'block'
            }}
          ></canvas>
        </>
      )}
    </div>
  )
}
