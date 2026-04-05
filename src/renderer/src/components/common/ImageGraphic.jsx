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

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { getImagesData, getImagesTbl, getSpritesData } from '../../utils/datStore'
import { decodeGRP, renderToCanvas } from '../../utils/grpDecoder'
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
  restartKey = 0,
  parentFrameInfo
}, ref) => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasNoScript, setHasNoScript] = useState(false)
  const [invalidFrame, setInvalidFrame] = useState(false)
  const [overlays, setOverlays] = useState([])

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

  // Reset ended state ONLY when a genuinely new animation starts.
  // NOT on 'animate' changes — that's the exact case we need to ignore.
  useEffect(() => {
    animationEndedRef.current = false
  }, [imageId, animationName, restartKey])

  // For manual step control
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

  // Playback refs (avoid re-render for these)
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
          prevImageIdRef.current = animKey
        }

        // Load IScript data (shared singleton)
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
        let lastRenderState = null

        // Get GRP frame count for bounds checking (VB: curretgrpMaxFrame)
        const grpView = new DataView(grpBuffer.buffer, grpBuffer.byteOffset, grpBuffer.byteLength)
        const grpFrameCount = grpView.getUint16(0, true)
        const grpWidth = grpView.getUint16(2, true)
        const grpHeight = grpView.getUint16(4, true)

        // VB: currentFrame (base frame index, NOT the final displayed frame)
        let currentFrame = 0
        // VB: x, y offsets controlled by sethorpos/setvertpos/setpos
        let posX = 0
        let posY = 0

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
            return { fIdx: currentFrame, flip: false }
          }
          const d = dir % 32
          if (d > 16) {
            return { fIdx: currentFrame + (32 - d), flip: true }
          } else {
            return { fIdx: currentFrame + d, flip: false }
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
              let minX = frameData.width, minY = frameData.height, maxXb = 0, maxYb = 0
              const pixels = frameData.data
              for (let y = 0; y < frameData.height; y++) {
                for (let x = 0; x < frameData.width; x++) {
                  if (pixels[y * frameData.width + x] !== 0) {
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
            renderToCanvas(tempCanvas.getContext('2d'), frameData, paletteToUse, playerColor, drawFunction, remappingNum)

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
        let currentScriptLabel = null
        let originalScriptLabel = null
        let scriptIndex = 0
        // For call/return stack (VB: Case &H35 call, Case &H36 return)
        let callStack = []

        if (animate && sharedIscriptData) {
          const header = sharedIscriptData.headers.find(h => h.is_id === iscriptId)
          if (header && header.entry_points) {
            let entryPoint = header.entry_points[animationName]

            // Fallback chain
            if (!entryPoint) {
              entryPoint = header.entry_points.Init ||
                header.entry_points.Walking ||
                Object.values(header.entry_points).find(v => v !== null)
            }

            if (!entryPoint) {
              if (active) { setHasNoScript(true); setLoading(false) }
              return
            } else {
              if (active) setHasNoScript(false)
              if (sharedIscriptData.labels[entryPoint]) {
                currentScriptLabel = entryPoint
                originalScriptLabel = entryPoint
              }
            }
          }
        }

        // ===== Initial static render (non-animated or first frame) =====
        // Skip if the animation already ended via 'end' opcode — prevents frame 0
        // from being drawn when animate=false re-triggers this effect after onAnimationEnd.
        currentFrame = 0
        if (!animationEndedRef.current) {
          drawWithDirection()
        }

        // ===== IScript execution history for manual stepping =====
        let iscriptHistory = []

        /**
         * processIScriptBlock - Execute script until a wait/end is hit
         * 
         * Mirrors VB's playScript() (IscriptModule.vb line 294-585)
         * Each call processes opcodes until 'wait' pauses or 'end' terminates.
         */
        const processIScriptBlock = () => {
          iscriptHistory.push({
            currentScriptLabel,
            originalScriptLabel,
            scriptIndex,
            currentFrame,
            posX, posY,
            renderState: lastRenderState ? { ...lastRenderState } : { fIdx: 0, flip: false }
          })

          let waitTicks = 0
          let executionCount = 0

          while (waitTicks === 0 && currentScriptLabel && executionCount < 200) {
            executionCount++
            const script = sharedIscriptData.labels[currentScriptLabel]
            if (!script || scriptIndex >= script.length) break
            // if (!script) break
            // // If we've reached the end of this script block, loop back to start
            // // (VB binary parser naturally continues to next byte; our label system needs explicit loop)
            // if (scriptIndex >= script.length) {
            //   scriptIndex = 0
            // }

            const instr = script[scriptIndex]
            const { opcode, args } = instr

            switch (opcode) {
              // ===== 0x00: playfram =====
              // VB: currentFrame = values(0); drawImageGRP(GetFrameNum, ...)
              case 'playfram': {
                currentFrame = parseInt(args[0], args[0].startsWith('0x') ? 16 : 10)
                // Bounds check
                if (grpFrameCount > 0 && currentFrame >= grpFrameCount) {
                  currentFrame = currentFrame % grpFrameCount
                }
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x01: playframtile =====
              // VB: NOT handled (no Case &H1 in Select Case) → NO-OP
              // This command is tileset-dependent and not relevant for previewer
              case 'playframtile': {
                scriptIndex++
                break
              }

              // ===== 0x02: sethorpos =====
              // VB: x = values(0); drawImageGRP(GetFrameNum, turnStatus, x, y)
              case 'sethorpos': {
                let val = parseInt(args[0])
                if (val > 127) val -= 256  // signed byte
                posX = val
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x03: setvertpos =====
              // VB: y = values(0); drawImageGRP(GetFrameNum, turnStatus, x, y)
              case 'setvertpos': {
                let val = parseInt(args[0])
                if (val > 127) val -= 256  // signed byte
                posY = val
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x04: setpos =====
              // VB: x = values(0); y = values(1); drawImageGRP(...)
              case 'setpos': {
                let vx = parseInt(args[0])
                let vy = parseInt(args[1])
                if (vx > 127) vx -= 256
                if (vy > 127) vy -= 256
                posX = vx
                posY = vy
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x05: wait =====
              // VB: iscirpt_wait = values(0)
              case 'wait': {
                waitTicks = parseInt(args[0]) || 1
                scriptIndex++
                break
              }

              // ===== 0x06: waitrand =====
              // VB: selectv = random.Next(values(0), values(1)); iscirpt_wait = selectv
              case 'waitrand': {
                const min = parseInt(args[0]) || 1
                const max = parseInt(args[1]) || min
                waitTicks = min + Math.floor(Math.random() * (max - min + 1))
                scriptIndex++
                break
              }

              // ===== 0x07: goto =====
              // VB: currentHeader = values(0)
              case 'goto': {
                const targetLabel = args[0]
                if (sharedIscriptData.labels[targetLabel]) {
                  currentScriptLabel = targetLabel
                  scriptIndex = 0
                } else {
                  currentScriptLabel = null
                }
                break
              }

              // ===== 0x08: imgol / 0x09: imgul =====
              // These use IMAGE IDs directly (from images.dat)
              case 'imgol':
              case 'imgul': {
                const overlayId = parseInt(args[0])
                let oX = parseInt(args[1] || 0)
                let oY = parseInt(args[2] || 0)
                if (oX > 127) oX -= 256
                if (oY > 127) oY -= 256
                setOverlays(prev => {
                  if (prev.find(o => o.imageId === overlayId && o.type === opcode)) return prev
                  return [...prev, { imageId: overlayId, x: oX, y: oY, type: opcode, key: `${opcode}_${overlayId}_${Date.now()}` }]
                })
                scriptIndex++
                break
              }

              // ===== 0x0F: sprol / 0x10: highsprol / 0x14: sprul =====
              // These use SPRITE IDs (from sprites.dat) — must resolve to image ID!
              // VB: sprol spawns a sprite, the visual comes from sprites.dat[sprite#]['Image File']
              case 'sprol':
              case 'highsprol':
              case 'sprul': {
                const spriteId = parseInt(args[0])
                let oX = parseInt(args[1] || 0)
                let oY = parseInt(args[2] || 0)
                if (oX > 127) oX -= 256
                if (oY > 127) oY -= 256
                // Resolve sprite ID → image ID via sprites.dat
                const spritesData = getSpritesData()
                const resolvedImageId = spritesData?.[spriteId]?.['Image File']
                if (resolvedImageId === undefined || resolvedImageId === null) {
                  scriptIndex++
                  break
                }
                setOverlays(prev => {
                  if (prev.find(o => o.imageId === resolvedImageId && o.type === opcode)) return prev
                  return [...prev, { imageId: resolvedImageId, x: oX, y: oY, type: opcode, key: `${opcode}_${resolvedImageId}_${Date.now()}` }]
                })
                scriptIndex++
                break
              }

              // ===== 0x0A: imgolorig =====
              case 'imgolorig': {
                const overlayId = parseInt(args[0])
                setOverlays(prev => {
                  if (prev.find(o => o.imageId === overlayId && o.type === opcode)) return prev
                  return [...prev, { imageId: overlayId, x: 0, y: 0, type: opcode, key: `${opcode}_${overlayId}_${Date.now()}` }]
                })
                scriptIndex++
                break
              }

              // ===== 0x0D: imgoluselo, 0x0E: imguluselo, 0x13: spruluselo, 0x15: sproluselo =====
              // These require LO* files which we don't have - skip gracefully
              case 'imgoluselo':
              case 'imguluselo':
              case 'spruluselo':
              case 'sproluselo': {
                scriptIndex++
                break
              }

              // ===== 0x3D: imgulnextid =====
              case 'imgulnextid': {
                const nextImageId = imageId + 1
                let oX = parseInt(args[0] || 0)
                let oY = parseInt(args[1] || 0)
                if (oX > 127) oX -= 256
                if (oY > 127) oY -= 256
                setOverlays(prev => {
                  if (prev.find(o => o.imageId === nextImageId && o.type === opcode)) return prev
                  return [...prev, { imageId: nextImageId, x: oX, y: oY, type: opcode, key: `${opcode}_${nextImageId}_${Date.now()}` }]
                })
                scriptIndex++
                break
              }

              // ===== 0x16: end =====
              // VB (IscriptModule.vb line 417-418): DatEditForm.ListBox9.SelectedIndex = -1
              // → 선택된 애니메이션 없음 = 아무 이미지도 그리지 않음.
              // Death 스크립트에서 end를 만나면 원본 유닛이 사라지고 캔버스가 비워진다.
              case 'end': {
                currentScriptLabel = null
                // Mark as ended — prevents frame 0 from being redrawn when
                // onAnimationEnd() causes animate prop to change, re-triggering this effect.
                animationEndedRef.current = true
                // Clear canvas to hide the image (mirrors VB's "nothing selected" state)
                if (canvasRef.current) {
                  canvasRef.current.width = canvasRef.current.width  // fast clear trick
                }
                if (callbacksRef.current.onAnimationEnd) {
                  callbacksRef.current.onAnimationEnd()
                }
                break
              }

              // ===== 0x1D: followmaingraphic =====
              // VB: drawImageGRP(GetFrameNum, turnStatus, x, y) — uses parent's frame
              case 'followmaingraphic': {
                if (parentFrameInfo && parentFrameInfo.current) {
                  renderFrame(parentFrameInfo.current.fIdx, parentFrameInfo.current.flip)
                } else {
                  drawWithDirection()
                }
                scriptIndex++
                break
              }

              // ===== 0x1E: randcondjmp =====
              // VB: If random <= values(0) Then currentHeader = values(1)
              case 'randcondjmp': {
                const chance = parseInt(args[0])
                const targetLabel = args[1]
                if (Math.floor(Math.random() * 256) <= chance) {
                  if (sharedIscriptData.labels[targetLabel]) {
                    currentScriptLabel = targetLabel
                    scriptIndex = 0
                  }
                } else {
                  scriptIndex++
                }
                break
              }

              // ===== 0x1F: turnccwise =====
              // VB: TrackBar1.Value = TrackBar1.Value - values(0), wrapping
              case 'turnccwise':
              case 'turncwise':
              case 'turn1cwise':
              case 'turnrand': {
                // Turn commands: skip in previewer (direction is user-controlled)
                scriptIndex++
                break
              }

              // ===== 0x2A: gotorepeatattk =====
              // VB: loops back to GndAttkRpt/AirAttkRpt
              case 'gotorepeatattk': {
                // In previewer, just loop current script back to start
                scriptIndex = 0
                break
              }

              // ===== 0x2B: engframe =====
              // Sets the base frame directly (like playfram, but for engine glows)
              // Data shows values like 0, 17 — these are direct set points
              // E.g. WraithAfterburnersInit: engframe 0, wait, engframe 17, wait, goto loop
              case 'engframe': {
                currentFrame = parseInt(args[0])
                // VB bounds check: If curretgrpMaxFrame <= currentFrame Then currentFrame = 0
                if (grpFrameCount > 0 && currentFrame >= grpFrameCount) {
                  currentFrame = currentFrame % grpFrameCount
                }
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x2C: engset =====
              // Sets the base frame to frameset# * 17
              // E.g. engset 1280 → 1280 * 17 = 21760 → exceeds GRP → wraps to 0
              case 'engset': {
                const setNum = parseInt(args[0])
                currentFrame = setNum * 17
                // VB bounds check: If curretgrpMaxFrame <= currentFrame Then currentFrame = 0
                if (grpFrameCount > 0 && currentFrame >= grpFrameCount) {
                  currentFrame = currentFrame % grpFrameCount
                }
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== 0x30: ignorerest =====
              case 'ignorerest': {
                currentScriptLabel = null
                break
              }

              // ===== 0x34: setfldirect =====
              // VB: gfxturn = False
              case 'setfldirect': {
                // In preview mode, we just ignore this
                scriptIndex++
                break
              }

              // ===== 0x35: call =====
              // VB: currentHeader = values(0)
              case 'call': {
                const targetLabel = args[0]
                if (sharedIscriptData.labels[targetLabel]) {
                  callStack.push({ label: currentScriptLabel, index: scriptIndex + 1 })
                  currentScriptLabel = targetLabel
                  scriptIndex = 0
                } else {
                  scriptIndex++
                }
                break
              }

              // ===== 0x36: return =====
              // VB: currentHeader = iscriptEntry(...).AnimHeader(currentAnimHeaderID)
              case 'return': {
                if (callStack.length > 0) {
                  const ret = callStack.pop()
                  currentScriptLabel = ret.label
                  scriptIndex = ret.index
                } else {
                  scriptIndex++
                }
                break
              }

              // ===== 0x40: warpoverlay =====
              // VB: currentFrame = values(0); drawImageGRP(GetFrameNum, ...)
              case 'warpoverlay': {
                currentFrame = parseInt(args[0])
                drawWithDirection()
                scriptIndex++
                break
              }

              // ===== All other opcodes: skip =====
              // This covers playsnd, playsndrand, playsndbtwn, domissiledmg,
              // attackmelee, attackwith, attack, castspell, useweapon, move,
              // sigorder, nobrkcodestart, nobrkcodeend, attkshiftproj,
              // tmprmgraphicstart, tmprmgraphicend, setflspeed,
              // creategasoverlays, pwrupcondjmp, etc.
              default: {
                scriptIndex++
                break
              }
            }
          }

          // Safety: if we ran out of opcodes without wait, default to 1 tick
          if (waitTicks === 0 && currentScriptLabel) {
            waitTicks = 1
          }

          return waitTicks
        }

        // ===== Manual stepping (for step buttons) =====
        manualRenderRef.current = (delta) => {
          if (delta > 0) {
            if (currentScriptLabel) {
              processIScriptBlock()
            }
          } else if (delta < 0) {
            if (iscriptHistory.length > 0) {
              const state = iscriptHistory.pop()
              currentScriptLabel = state.currentScriptLabel
              originalScriptLabel = state.originalScriptLabel
              scriptIndex = state.scriptIndex
              currentFrame = state.currentFrame
              posX = state.posX
              posY = state.posY
              if (state.renderState) {
                renderFrame(state.renderState.fIdx, state.renderState.flip)
              }
            }
          }
        }

        // ===== Animation loop =====
        if (animate && currentScriptLabel) {
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
              } else if (!currentScriptLabel && originalScriptLabel) {
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
            imageId={ov.imageId}
            animate={true}
            animationName="Init"
            direction={direction}
            playerColor={playerColor}
            tileset={tileset}
            parentFrameInfo={currentFrameInfo}
            maxWidth={2000}
            maxHeight={2000}
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
