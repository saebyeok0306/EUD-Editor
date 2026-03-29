import { useState, useEffect, useRef } from 'react'
import { getImagesData, getImagesTbl } from '../../utils/datStore'
import { decodeGRP, renderToCanvas, PLAYER_COLORS } from '../../utils/grpDecoder'
import { loadPalette } from '../../utils/paletteLoader'
import iscriptJsonUrl from '../../data/iscript_data.json?url'

let sharedIscriptData = null
const graphicCache = new Map()

export default function ImageGraphic({ 
  imageId, 
  playerColor = 'Red', 
  tileset = 'badlands', 
  maxWidth = 64, 
  maxHeight = 64, 
  autoCrop = false, 
  style = {}, 
  onDebugInfo, 
  animate = false,
  animationName = 'Init',
  direction = 0,
  onFrameChange
}) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasNoScript, setHasNoScript] = useState(false)

  const callbacksRef = useRef({ onDebugInfo, onFrameChange })
  useEffect(() => {
    callbacksRef.current = { onDebugInfo, onFrameChange }
  }, [onDebugInfo, onFrameChange])

  useEffect(() => {
    let active = true
    let timer = null

    async function loadGraphic() {
      if (imageId === null || imageId === undefined) return

      try {
        setLoading(true)
        setErrorMsg('')

        const imagesData = getImagesData()
        const imagesTbl = getImagesTbl()

        if (!imagesData?.[imageId]) throw new Error('Image data not found for ID: ' + imageId)

        let targetPath = imagesTbl[imagesData[imageId]['GRP File'] - 1]
        if (!targetPath) throw new Error('images.tbl path not found')

        targetPath = targetPath.replace(/\\/g, '/').replace(/^SD\//i, '').replace(/^SD\\/i, '')
        if (!targetPath.toLowerCase().startsWith('unit/')) targetPath = 'unit/' + targetPath
        targetPath = targetPath.replace(/\.[^/.]+$/, "") + ".grp"

        if (callbacksRef.current.onDebugInfo) {
          callbacksRef.current.onDebugInfo({ imageId, path: targetPath })
        }

        const drawFunction = imagesData[imageId]['Draw Function'] || 0
        const remappingNum = imagesData[imageId]['Remapping'] || 0
        const paletteToUse = await loadPalette(targetPath, tileset, drawFunction, remappingNum)

        // Load JSON Iscript only if animating
        if (animate && !sharedIscriptData) {
          try {
            const response = await fetch(iscriptJsonUrl)
            if (response.ok) {
              sharedIscriptData = await response.json()
            }
          } catch (e) {
            console.error('[ImageGraphic] iscript_data.json load failed:', e)
          }
        }

        let grpBuffer = graphicCache.get(targetPath)
        if (!grpBuffer) {
          grpBuffer = await window.api.getDatapackFile(targetPath)
          if (grpBuffer) graphicCache.set(targetPath, grpBuffer)
        }

        if (!active || !grpBuffer) {
          if (!grpBuffer && active) setErrorMsg('GRP not found')
          return
        }

        const finalCtx = canvasRef.current?.getContext('2d')
        if (!finalCtx) return

        const iscriptId = imagesData[imageId]['Iscript ID'] & 0xFFFF

        let currentScript = null
        let originalScript = null
        let scriptIndex = 0

        if (animate && sharedIscriptData) {
          const header = sharedIscriptData.headers.find(h => h.is_id === iscriptId)
          if (header && header.entry_points) {
            let entryPoint = header.entry_points[animationName]
            
            // Fallback if the requested animation (e.g. Walking) is explicitly null or undefined
            if (!entryPoint) {
              entryPoint = header.entry_points.Init || 
                           header.entry_points.Walking || 
                           Object.values(header.entry_points).find(v => v !== null)
            }

            if (!entryPoint) {
              if (active) {
                setHasNoScript(true)
                setLoading(false)
              }
              return
            } else {
              if (active) setHasNoScript(false)
              if (sharedIscriptData.labels[entryPoint]) {
                currentScript = entryPoint
                originalScript = entryPoint
              }
            }
          }
        }

        const hasTurns = !!imagesData[imageId]['Gfx Turns']
        const decodedFrameCache = new Map()

        const renderFrame = (fIdx, flip = false) => {
          if (!active || !grpBuffer || !canvasRef.current) return
          let cached = decodedFrameCache.get(fIdx)

          if (!cached) {
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
            renderToCanvas(tempCanvas.getContext('2d'), frameData, paletteToUse, PLAYER_COLORS[playerColor], drawFunction, remappingNum)
            
            cached = { tempCanvas, cropWidth, cropHeight, offsetX, offsetY }
            decodedFrameCache.set(fIdx, cached)
          }

          const { tempCanvas, cropWidth, cropHeight, offsetX, offsetY } = cached

          canvasRef.current.width = cropWidth
          canvasRef.current.height = cropHeight
          finalCtx.clearRect(0, 0, cropWidth, cropHeight)

          finalCtx.save()
          if (flip) {
            finalCtx.translate(cropWidth, 0)
            finalCtx.scale(-1, 1)
          }
          finalCtx.drawImage(tempCanvas, offsetX, offsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
          finalCtx.restore()
          
          if (callbacksRef.current.onFrameChange) {
            callbacksRef.current.onFrameChange(fIdx)
          }
        }

        let initialIdx = 0
        let initialFlip = false
        if (!animate && hasTurns) {
           const dir = direction % 32
           if (dir <= 16) initialIdx += dir
           else { initialIdx += (32 - dir); initialFlip = true }
        }
        renderFrame(initialIdx, initialFlip)

        // Animation loop
        if (animate && currentScript) {
          const loop = () => {
            if (!active) return

            let waitTicks = 0
            let executionCount = 0
            while (waitTicks === 0 && currentScript && executionCount < 100) {
              executionCount++
              const script = sharedIscriptData.labels[currentScript]
              if (!script || scriptIndex >= script.length) break

              const instr = script[scriptIndex]
              const { opcode, args } = instr

              if (opcode === 'playfram') {
                let fIdx = parseInt(args[0], args[0].startsWith('0x') ? 16 : 10)
                let flip = false
                if (hasTurns) {
                  const dir = direction % 32
                  if (dir <= 16) {
                    fIdx += dir
                  } else {
                    fIdx += (32 - dir)
                    flip = true
                  }
                }
                renderFrame(fIdx, flip)
                scriptIndex++
              } else if (opcode === 'wait') {
                waitTicks = parseInt(args[0]) || 1
                scriptIndex++
              } else if (opcode === 'imgul') {
                // Usually means render another layer, but we skip for simple preview
                scriptIndex++
              } else if (opcode === 'turncwise' || opcode === 'turnccwise' || opcode === 'turn1cwise') {
                // Turn logic
                scriptIndex++
              } else if (opcode === 'goto') {
                const targetLabel = args[0]
                if (sharedIscriptData.labels[targetLabel]) {
                  currentScript = targetLabel
                  scriptIndex = 0
                } else {
                  currentScript = null
                }
              } else if (opcode === 'gotorepeatattk') {
                scriptIndex = 0
              } else if (opcode === 'end') {
                currentScript = null
              } else {
                scriptIndex++
              }
            }

            if (active) {
              if (waitTicks === 0 && currentScript) {
                waitTicks = 1
              }
              if (waitTicks > 0) {
                timer = setTimeout(loop, waitTicks * (1000 / 12)) // 12 FPS for slower preview
              } else if (!currentScript && originalScript) {
                // Animation ended, restart it after a brief delay
                currentScript = originalScript
                scriptIndex = 0
                timer = setTimeout(loop, 1000 / 12)
              }
            }
          }
          loop()
        }

        setLoading(false)
      } catch (err) {
        if (active) {
          setErrorMsg(err.message)
          setLoading(false)
        }
      }
    }

    loadGraphic()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [imageId, animate, animationName, direction, playerColor, autoCrop, tileset])

  if (errorMsg) {
    return (
      <div style={{ ...style, width: maxWidth, height: maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: '#ff5555', fontSize: '10px', textAlign: 'center', padding: '4px' }}>
        {errorMsg}
      </div>
    )
  }

  return (
    <div style={{ ...style, width: maxWidth, height: maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', color: '#aaa', fontSize: '10px', zIndex: 10 }}>
          Loading...
        </div>
      )}
      
      {hasNoScript && animate && (
        <div style={{ position: 'absolute', color: 'var(--ev-c-text-3)', fontSize: '12px', zIndex: 5 }}>
          No Script
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          display: (loading || (hasNoScript && animate)) ? 'none' : 'block'
        }}
      ></canvas>
    </div>
  )
}
