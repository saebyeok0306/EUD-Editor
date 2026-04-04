import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { getImagesData, getImagesTbl } from '../../utils/datStore'
import { decodeGRP, renderToCanvas, PLAYER_COLORS } from '../../utils/grpDecoder'
import { loadPalette } from '../../utils/paletteLoader'
import iscriptJsonUrl from '../../data/iscript_data.json?url'

let sharedIscriptData = null
const graphicCache = new Map()

const ImageGraphic = forwardRef(({
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
  onFrameChange,
  customData = null,
  playbackSpeed = 1,
  paused = false,
  onAnimationEnd,
  restartKey = 0
}, ref) => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasNoScript, setHasNoScript] = useState(false)
  const [invalidFrame, setInvalidFrame] = useState(false)

  const callbacksRef = useRef({ onDebugInfo, onFrameChange, onAnimationEnd })
  useEffect(() => {
    callbacksRef.current = { onDebugInfo, onFrameChange, onAnimationEnd }
  }, [onDebugInfo, onFrameChange, onAnimationEnd])

  const currentRawFrameRef = useRef(0)
  const currentFlipRef = useRef(false)
  const manualRenderRef = useRef(null)

  useImperativeHandle(ref, () => ({
    stepFrame: (delta) => {
      if (manualRenderRef.current) {
        manualRenderRef.current(delta)
      }
    }
  }))

  const speedRef = useRef(playbackSpeed)
  useEffect(() => {
    speedRef.current = playbackSpeed
  }, [playbackSpeed])

  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

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

        const itemData = { ...imagesData[imageId], ...(customData || {}) }

        let targetPath = imagesTbl[itemData['GRP File'] - 1]
        if (!targetPath) throw new Error('images.tbl path not found')

        targetPath = targetPath.replace(/\\/g, '/').replace(/^SD\//i, '').replace(/^SD\\/i, '')
        if (!targetPath.toLowerCase().startsWith('unit/')) targetPath = 'unit/' + targetPath
        targetPath = targetPath.replace(/\.[^/.]+$/, "") + ".grp"

        if (callbacksRef.current.onDebugInfo) {
          callbacksRef.current.onDebugInfo({ imageId, path: targetPath })
        }

        const drawFunction = itemData['Draw Function'] || 0
        const remappingNum = itemData['Remapping'] || 0
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

        const iscriptId = itemData['Iscript ID'] & 0xFFFF

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

        const hasTurns = !!itemData['Gfx Turns']
        const decodedFrameCache = new Map()

        let lastRenderState = null

        const renderFrame = (fIdx, flip = false) => {
          if (!active || !grpBuffer || !canvasRef.current) return
          
          currentRawFrameRef.current = fIdx
          currentFlipRef.current = flip
          lastRenderState = { fIdx, flip }

          let cached = decodedFrameCache.get(fIdx)

          if (!cached) {
            const frameData = decodeGRP(grpBuffer, fIdx)
            if (!frameData) {
               if (active) setInvalidFrame(true)
               canvasRef.current.width = maxWidth || 100
               canvasRef.current.height = maxHeight || 100
               finalCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
               if (callbacksRef.current.onFrameChange) {
                 callbacksRef.current.onFrameChange(fIdx)
               }
               return
            }

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

          if (active) setInvalidFrame(false)

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

        let iscriptHistory = []

        const processIScriptBlock = () => {
          iscriptHistory.push({
            currentScript,
            originalScript,
            scriptIndex,
            renderState: { ...lastRenderState }
          })

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

          if (waitTicks === 0 && currentScript) {
            waitTicks = 1
          }

          return waitTicks
        }

        manualRenderRef.current = (delta) => {
          if (delta > 0) {
            if (currentScript) {
              processIScriptBlock()
            }
          } else if (delta < 0) {
            if (iscriptHistory.length > 0) {
              const state = iscriptHistory.pop()
              currentScript = state.currentScript
              originalScript = state.originalScript
              scriptIndex = state.scriptIndex
              renderFrame(state.renderState.fIdx, state.renderState.flip)
            }
          }
        }

        // Animation loop
        if (animate && currentScript) {
          const loop = () => {
            if (!active) return

            if (pausedRef.current) {
              timer = setTimeout(loop, 1000 / 24)
              return
            }

            const waitTicks = processIScriptBlock()

            if (active) {
              if (waitTicks > 0) {
                timer = setTimeout(loop, waitTicks * (1000 / 24) * (1 / speedRef.current))
              } else if (!currentScript && originalScript) {
                // Animation ended
                if (callbacksRef.current.onAnimationEnd) {
                  callbacksRef.current.onAnimationEnd()
                }
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
  }, [imageId, animate, animationName, direction, playerColor, autoCrop, tileset, customData, restartKey])

  if (errorMsg) {
    return (
      <div style={{ ...style, width: maxWidth, height: maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: '#ff5555', fontSize: '10px', textAlign: 'center', padding: '4px' }}>
        {errorMsg}
      </div>
    )
  }

  if (imageId === null || imageId === undefined || imageId >= 65535) {
    return null
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

      {invalidFrame && !loading && (
        <div style={{ position: 'absolute', color: '#ff5555', fontWeight: 'bold', fontSize: '14px', zIndex: 11, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ff5555' }}>
          No Frame
        </div>
      )}
    </div>
  )
})

export default ImageGraphic
