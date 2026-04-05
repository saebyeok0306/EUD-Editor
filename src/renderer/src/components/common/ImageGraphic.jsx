/**
 * ImageGraphic - StarCraft GRP/IScript Rendering Engine
 * 
 * Rewritten based on the original Visual Basic IscriptModule.vb & GRPModule.vb logic.
 * Core design: "Base Frame + Direction Offset" model.
 * 
 * Key concepts from VB source:
 * - currentFrame: base frame index set by playfram/engframe/engset
 * - GetFrameNum(): applies direction offset (0-16 range + flip for 17-31)
 * - engframe: currentFrame += 17 (next direction set)
 * - engset: currentFrame += value * 17 (jump to Nth direction set)
 * - followmaingraphic: child uses parent's current rendered frame
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { getImagesData, getImagesTbl, getSpritesData } from '../../utils/datStore'
import { decodeGRP, renderToCanvas, decodeAndRenderGRP } from '../../utils/grpDecoder'
import { loadPalette } from '../../utils/paletteLoader'
import iscriptJsonUrl from '../../data/iscript_data.json?url'
import { isIscriptWasmReady, initIscriptDataRaw, getIscriptLabel, createIscriptState, stepIscriptLogic } from '../../utils/iscriptWasm'

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
  restartKey = 0,
  parentFrameInfo
}, ref) => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasNoScript, setHasNoScript] = useState(false)
  const [invalidFrame, setInvalidFrame] = useState(false)
  const [overlays, setOverlays] = useState([])
  const activeOverlaysRef = useRef(new Set())
  const overlayCounterRef = useRef(0)

  const handleOverlayEnd = useCallback((key) => {
    activeOverlaysRef.current.delete(key)
    setOverlays(prev => prev.filter(o => o.key !== key))
    if (animationEndedRef.current && activeOverlaysRef.current.size === 0) {
      if (callbacksRef.current.onAnimationEnd) {
        callbacksRef.current.onAnimationEnd()
      }
    }
  }, [])

  // Refs for callbacks (avoid re-render dependency)
  const callbacksRef = useRef({ onDebugInfo, onFrameChange, onAnimationEnd })
  const prevImageIdRef = useRef(null)
  // Expose current frame info for child overlays (followmaingraphic)
  const currentFrameInfo = useRef({ fIdx: 0, flip: false })
  // Track whether animation ended via 'end' opcode — prevents re-drawing frame 0
  // when animate=false causes useEffect to re-run (e.g. after onAnimationEnd fires)
  const animationEndedRef = useRef(false)

  useEffect(() => {
    callbacksRef.current = { onDebugInfo, onFrameChange, onAnimationEnd }
  }, [onDebugInfo, onFrameChange, onAnimationEnd])

  // IScript state that should persist across re-renders
  const iscriptStateRef = useRef({
    initialized: false,
    currentFrame: 0,
    posX: 0,
    posY: 0,
    currentScriptLabel: null,
    originalScriptLabel: null,
    scriptIndex: 0,
    callStack: [],
    iscriptHistory: [],
    lastRenderState: null,
    wasmState: null
  })

  // Reset ended state ONLY when a genuinely new animation starts.
  // NOT on 'animate' changes — that's the exact case we need to ignore.
  useEffect(() => {
    animationEndedRef.current = false
    setOverlays([])
    activeOverlaysRef.current.clear()
    iscriptStateRef.current = {
      initialized: false,
      currentFrame: 0,
      posX: 0,
      posY: 0,
      currentScriptLabel: null,
      originalScriptLabel: null,
      scriptIndex: 0,
      callStack: [],
      iscriptHistory: [],
      lastRenderState: null,
      // wasmState persists across init
    }
  }, [imageId, animationName, restartKey])

  // For manual step control
  const currentRawFrameRef = useRef(0)
  const currentFlipRef = useRef(false)
  const manualRenderRef = useRef(null)

  const overlayRefs = useRef(new Map())

  useImperativeHandle(ref, () => ({
    stepFrame: (delta) => {
      if (manualRenderRef.current) {
        manualRenderRef.current(delta)
      }
      // Forward the step to all active overlays
      overlayRefs.current.forEach((overlay) => {
        if (overlay && overlay.stepFrame) {
          overlay.stepFrame(delta)
        }
      })
    }
  }))

  // Playback refs (avoid re-render for these)
  const animateRef = useRef(animate)
  useEffect(() => { animateRef.current = animate }, [animate])

  const speedRef = useRef(playbackSpeed)
  useEffect(() => { speedRef.current = playbackSpeed }, [playbackSpeed])

  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  // ===== MAIN EFFECT =====
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

        // Clear overlays when switching to a different image OR animation
        const animKey = `${imageId}::${animationName}`
        if (prevImageIdRef.current !== animKey) {
          setOverlays([])
          activeOverlaysRef.current.clear()
          prevImageIdRef.current = animKey
        }

        // Load IScript data (shared singleton)
        if (animate && !sharedIscriptData) {
          try {
            const response = await fetch(iscriptJsonUrl)
            if (response.ok) {
              const text = await response.text()
              sharedIscriptData = JSON.parse(text)
              if (isIscriptWasmReady()) {
                initIscriptDataRaw(text)
              }
            }
          } catch (e) {
            console.error('[ImageGraphic] iscript_data.json load failed:', e)
          }
        }

        // Load GRP buffer (cached)
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

        // ===== IScript State Machine (mirrors VB CIscript class) =====
        const hasTurns = !!itemData['Gfx Turns']
        const decodedFrameCache = new Map()
        const state = iscriptStateRef.current

        // Get GRP frame count for bounds checking (VB: curretgrpMaxFrame)
        const grpView = new DataView(grpBuffer.buffer, grpBuffer.byteOffset, grpBuffer.byteLength)
        const grpFrameCount = grpView.getUint16(0, true)
        const grpWidth = grpView.getUint16(2, true)
        const grpHeight = grpView.getUint16(4, true)

        /**
         * GetFrameNum - mirrors VB's GetFrameNum()
         * 
         * VB source (IscriptModule.vb line 588-605):
         *   If gfxturn = True Then
         *     If direction > 16 Then
         *       ReturnFrame = currentFrame + 33 - direction  (flip = true)
         *     Else
         *       ReturnFrame = currentFrame + direction       (flip = false)
         *     End If
         *   Else
         *     ReturnFrame = currentFrame (flip = false)
         *   End If
         * 
         * Note: VB uses 33 directions (0-32), we use 32 (0-31).
         * Adjusted: 33 -> 32 for our 32-direction system.
         */
        const getFrameNum = (dir) => {
          if (!hasTurns) {
            return { fIdx: state.currentFrame, flip: false }
          }
          const d = dir % 32
          if (d > 16) {
            return { fIdx: state.currentFrame + (32 - d), flip: true }
          } else {
            return { fIdx: state.currentFrame + d, flip: false }
          }
        }

        /**
         * renderFrame - decode GRP frame and paint to canvas
         */
        const renderFrame = (fIdx, flip = false) => {
          currentFrameInfo.current = { fIdx, flip }
          if (!active || !grpBuffer || !canvasRef.current) return

          currentRawFrameRef.current = fIdx
          currentFlipRef.current = flip
          state.lastRenderState = { fIdx, flip }

          let cached = decodedFrameCache.get(fIdx)

          if (!cached) {
            // Use the combined Rust WASM decoder + renderer for high performance
            const frameData = decodeAndRenderGRP(grpBuffer, fIdx, paletteToUse, playerColor, drawFunction, remappingNum)
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
              let minX = frameData.width, minY = frameData.height, maxXb = 0, maxYb = 0
              const pixels = frameData.data
              const isRgba = pixels.length === frameData.width * frameData.height * 4
              for (let y = 0; y < frameData.height; y++) {
                for (let x = 0; x < frameData.width; x++) {
                  const idx = isRgba ? ((y * frameData.width + x) * 4 + 3) : (y * frameData.width + x)
                  if (pixels[idx] !== 0) {
                    if (x < minX) minX = x; if (y < minY) minY = y
                    if (x > maxXb) maxXb = x; if (y > maxYb) maxYb = y
                  }
                }
              }
              if (minX <= maxXb && minY <= maxYb) {
                cropWidth = maxXb - minX + 1; cropHeight = maxYb - minY + 1
                offsetX = minX; offsetY = minY
              }
            }

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = frameData.width
            tempCanvas.height = frameData.height
            const tempCtx = tempCanvas.getContext('2d')
            // If it's already RGBA from WASM, just putImageData
            if (frameData.data.length === frameData.width * frameData.height * 4) {
              const imgData = new ImageData(new Uint8ClampedArray(frameData.data), frameData.width, frameData.height)
              tempCtx.putImageData(imgData, 0, 0)
            } else {
              renderToCanvas(tempCtx, frameData, paletteToUse, playerColor, drawFunction, remappingNum)
            }

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

        /**
         * drawWithDirection - convenience: set currentFrame, compute direction, render
         */
        const drawWithDirection = () => {
          const { fIdx, flip } = getFrameNum(direction)
          renderFrame(fIdx, flip)
        }

        // ===== IScript resolution =====
        const iscriptId = itemData['Iscript ID'] & 0xFFFF

        if (sharedIscriptData && (!state.initialized || (!parentFrameInfo && animationEndedRef.current))) {
          let entryPoint = null
          if (isIscriptWasmReady() && state.wasmState) {
            entryPoint = getIscriptLabel(iscriptId, animationName)
          } else {
            const header = sharedIscriptData.headers.find(h => h.is_id === iscriptId)
            if (header && header.entry_points) {
              entryPoint = header.entry_points[animationName]
              if (!entryPoint) {
                entryPoint = header.entry_points.Init || header.entry_points.Walking || Object.values(header.entry_points).find(v => v !== null)
              }
            }
          }

          if (!entryPoint) {
            if (active) { setHasNoScript(true); setLoading(false) }
            return
          } else {
            if (active) setHasNoScript(false)
            if (isIscriptWasmReady() && !state.wasmState) {
              state.wasmState = createIscriptState()
            }
            if (state.wasmState) {
              state.wasmState.reset(entryPoint)
            }
            state.currentScriptLabel = entryPoint
            state.originalScriptLabel = entryPoint
            state.scriptIndex = 0
            state.callStack = []
            state.iscriptHistory = []
            state.currentFrame = 0
            state.posX = 0
            state.posY = 0
            state.lastRenderState = null
            state.initialized = true
            animationEndedRef.current = false
            setOverlays([])
            activeOverlaysRef.current.clear()
          }
        }

        // ===== Initial static render (non-animated or first frame) =====
        // Skip if the animation already ended via 'end' opcode — prevents frame 0
        // from being drawn when animate=false re-triggers this effect after onAnimationEnd.
        if (!animationEndedRef.current) {
          if (!state.initialized && !animate) {
            state.currentFrame = 0
          }
          drawWithDirection()
        }

        /**
         * processIScriptBlock - Execute script until a wait/end is hit
         * 
         * Mirrors VB's playScript() (IscriptModule.vb line 294-585)
         * Each call processes opcodes until 'wait' pauses or 'end' terminates.
         */
        const processIScriptBlock = () => {
          state.iscriptHistory.push({
            currentScriptLabel: state.wasmState ? state.wasmState.get_label() : state.currentScriptLabel,
            originalScriptLabel: state.originalScriptLabel,
            scriptIndex: state.wasmState ? state.wasmState.get_script_index() : state.scriptIndex,
            currentFrame: state.wasmState ? state.wasmState.current_frame : state.currentFrame,
            posX: state.wasmState ? state.wasmState.pos_x : state.posX, 
            posY: state.wasmState ? state.wasmState.pos_y : state.posY,
            renderState: state.lastRenderState ? { ...state.lastRenderState } : { fIdx: 0, flip: false },
            activeOverlayKeys: Array.from(activeOverlaysRef.current)
          })

          let waitTicks = 0

          // Use WASM if available
          if (isIscriptWasmReady() && state.wasmState) {
            waitTicks = stepIscriptLogic(state.wasmState, grpFrameCount)
            
            // Sync state back
            state.currentScriptLabel = state.wasmState.get_label()
            state.scriptIndex = state.wasmState.get_script_index()
            state.currentFrame = state.wasmState.current_frame
            state.posX = state.wasmState.pos_x
            state.posY = state.wasmState.pos_y

            // Process Overlays
            const overlaysToPush = state.wasmState.pop_overlays()
            for (let i = 0; i < overlaysToPush.length; i++) {
              const o = overlaysToPush[i]
              const { opcode, id, x, y } = o
              
              if (opcode === 'end') {
                 // Should be true because we set it
              } else if (opcode === 'imgol' || opcode === 'imgul' || opcode === 'imgolorig' || opcode === 'imgulnextid') {
                const targetId = (opcode === 'imgulnextid') ? imageId + 1 : id
                const newKey = `${opcode}_${targetId}_${overlayCounterRef.current++}`
                activeOverlaysRef.current.add(newKey)
                setOverlays(prev => [...prev, { imageId: targetId, x: x, y: y, type: opcode, key: newKey }])
              } else if (opcode === 'sprol' || opcode === 'highsprol' || opcode === 'sprul') {
                const spritesData = getSpritesData()
                const resolvedImageId = spritesData?.[id]?.['Image File']
                if (resolvedImageId !== undefined && resolvedImageId !== null) {
                  const newKey = `${opcode}_${resolvedImageId}_${overlayCounterRef.current++}`
                  activeOverlaysRef.current.add(newKey)
                  setOverlays(prev => [...prev, { imageId: resolvedImageId, x: x, y: y, type: opcode, key: newKey }])
                }
              }
            }

            if (state.wasmState.animation_ended) {
              state.currentScriptLabel = null
              animationEndedRef.current = true
              if (canvasRef.current) {
                canvasRef.current.width = canvasRef.current.width
              }
              if (activeOverlaysRef.current.size === 0) {
                if (callbacksRef.current.onAnimationEnd) {
                  callbacksRef.current.onAnimationEnd()
                }
              }
            } else if (state.currentScriptLabel === null) {
              // Wait or aborted. We just draw if it hasn't ended.
              if (!animationEndedRef.current) drawWithDirection()
            } else {
               drawWithDirection()
            }

            return waitTicks
          }

          // If WASM is not ready for some reason, just stall animation
          return 1
        }

        // ===== Manual stepping (for step buttons) =====
        manualRenderRef.current = (delta) => {
          if (delta > 0) {
            if (state.currentScriptLabel) {
              processIScriptBlock()
            }
          } else if (delta < 0) {
            if (state.iscriptHistory.length > 0) {
              const prev = state.iscriptHistory.pop()
              state.currentScriptLabel = prev.currentScriptLabel
              state.originalScriptLabel = prev.originalScriptLabel
              state.scriptIndex = prev.scriptIndex
              state.currentFrame = prev.currentFrame
              state.posX = prev.posX
              state.posY = prev.posY
              if (state.wasmState) {
                state.wasmState.set_state(prev.currentScriptLabel || null, prev.scriptIndex, prev.currentFrame, prev.posX, prev.posY)
              }
              if (prev.renderState) {
                renderFrame(prev.renderState.fIdx, prev.renderState.flip)
              }
              if (prev.activeOverlayKeys) {
                const savedKeys = new Set(prev.activeOverlayKeys)
                activeOverlaysRef.current = new Set(savedKeys)
                setOverlays(current => current.filter(ov => savedKeys.has(ov.key)))
              }
            }
          }
        }

        // ===== Animation loop =====
        if (animateRef.current && state.currentScriptLabel) {
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
              }
              // Note: onAnimationEnd is NOT called here.
              // The 'end' opcode handler (case 'end') already manages this:
              //   - If no active overlays → fires onAnimationEnd immediately
              //   - If overlays exist → defers until all overlays finish (via handleOverlayEnd)
              // Calling it here would duplicate the callback and kill overlay animations.
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
  }, [imageId, animationName, direction, playerColor, autoCrop, tileset, customData, restartKey])

  // ===== RENDER =====
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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: maxWidth || 'auto', height: maxHeight || 'auto', ...style }}>
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
          display: (loading || (hasNoScript && animate)) ? 'none' : 'block',
          zIndex: 2
        }}
      ></canvas>

      {overlays.map(ov => {
        const isFlipped = currentFrameInfo.current?.flip || false
        const adjustedX = isFlipped ? -ov.x : ov.x

        return (
          <ImageGraphic
            key={ov.key}
            ref={(el) => {
              if (el) overlayRefs.current.set(ov.key, el)
              else overlayRefs.current.delete(ov.key)
            }}
            imageId={ov.imageId}
            animate={animate}
            animationName="Init"
            direction={direction}
            playerColor={playerColor}
            tileset={tileset}
            parentFrameInfo={currentFrameInfo}
            maxWidth={2000}
            maxHeight={2000}
            restartKey={restartKey}
            playbackSpeed={playbackSpeed}
            paused={paused}
            onAnimationEnd={() => handleOverlayEnd(ov.key)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${adjustedX}px)`,
              top: `calc(50% + ${ov.y}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: (ov.type === 'imgul' || ov.type === 'sprul') ? 1 : 3,
              pointerEvents: 'none'
            }}
          />
        )
      })}

      {invalidFrame && !loading && (
        <div style={{ position: 'absolute', color: '#ff5555', fontWeight: 'bold', fontSize: '14px', zIndex: 11, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ff5555' }}>
          No Frame
        </div>
      )}
    </div>
  )
})

export default ImageGraphic
