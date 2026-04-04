import init, { decode_grp_frame } from '../wasm/rust_grp.js'
import wasmUrl from '../wasm/rust_grp_bg.wasm?url'

let wasmReady = false

export const initWasm = async () => {
  if (!wasmReady) {
    try {
      await init(wasmUrl)
      wasmReady = true
      console.log("[GRP Decoder] Rust WASM Module Loaded!")
    } catch (e) {
      console.error("[GRP Decoder] WASM load failed, fallback to JS.", e)
    }
  }
}

// Auto-initialize when imported
initWasm()

export function decodeGRP(buffer, frameIndex = 0) {
  if (wasmReady) {
    try {
      const result = decode_grp_frame(buffer, frameIndex)
      return {
        width: result.width,
        height: result.height,
        data: result.data,
        frameCount: result.frameCount
      }
    } catch (err) {
      if (!err.toString().includes("out of bounds")) {
        console.error(`[WASM GRP Decoder] Failed: ${err}`)
      }
      // Fallback to JS if WASM fails (e.g. out of bounds error from Rust)
    }
  }

  // JS Fallback implementation
  try {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const frameCount = view.getUint16(0, true)
    const width = view.getUint16(2, true)
    const height = view.getUint16(4, true)
    
    // console.log(`[GRP Decoder] Size: ${buffer.byteLength}, Frames: ${frameCount}, W: ${width}, H: ${height}`)

    // VB: frame = frame Mod framecount (GRPModule.vb line 536)
    // Silently wrap out-of-bounds frames instead of failing
    if (frameCount > 0 && frameIndex >= frameCount) {
      frameIndex = frameIndex % frameCount
    }

    const frameTableOffset = 6 + frameIndex * 8
    if (frameTableOffset + 8 > buffer.byteLength) {
      throw new Error(`Frame table offset ${frameTableOffset} out of bounds`)
    }
    
    const fx = view.getUint8(frameTableOffset)
    const fy = view.getUint8(frameTableOffset + 1)
    const fw = view.getUint8(frameTableOffset + 2)
    const fh = view.getUint8(frameTableOffset + 3)
    let frameOffset = view.getUint32(frameTableOffset + 4, true)
    
    // SC:Remastered SD grp offsets might have the highest bit set? Let's check bitmask just in case.
    frameOffset = frameOffset & 0x0FFFFFFF // Mask out any potential flags

    if (frameOffset + 2 * fh > buffer.byteLength) {
      const hex = Array.from(new Uint8Array(buffer.buffer, buffer.byteOffset, Math.min(32, buffer.byteLength))).map(b => b.toString(16).padStart(2, '0')).join(' ')
      throw new Error(`Frame data offset ${frameOffset} out of bounds. Hex: ${hex}`)
    }

    const lineOffsets = frameOffset
    
    // console.log(`[GRP Decoder] Frame ${frameIndex} @ ${frameOffset} -> X:${fx} Y:${fy} W:${fw} H:${fh}`)

    // Basic heuristic: if width/height are unreasonable, fail early
    // StarCraft frames sometimes exceed global width/height, so we adapt dynamically.
    const actualWidth = Math.max(width, fx + fw);
    const actualHeight = Math.max(height, fy + fh);

    const canvasData = new Uint8Array(actualWidth * actualHeight)
  
  for (let y = 0; y < fh; y++) {
    const lineOffset = view.getUint16(lineOffsets + y * 2, true)
    let currentOffset = frameOffset + lineOffset
    let x = 0
    
    while (x < fw) {
      if (currentOffset >= buffer.byteLength) {
        console.warn(`[GRP Decoder] Warning: reached end of buffer at offset ${currentOffset} while decoding frame ${frameIndex}`)
        break
      }
      const b = view.getUint8(currentOffset++)
      if (b >= 0x80) {
        // Skip
        x += (b - 0x80)
      } else if (b >= 0x40) {
        // Repeat
        const count = b - 0x40
        if (currentOffset >= buffer.byteLength) break
        const color = view.getUint8(currentOffset++)
        for (let i = 0; i < count; i++) {
          if (x < fw && fy + y < actualHeight && fx + x < actualWidth) {
            canvasData[(fy + y) * actualWidth + (fx + x)] = color
          }
          x++
        }
      } else {
        // Raw
        const count = b
        for (let i = 0; i < count; i++) {
          if (currentOffset >= buffer.byteLength) break
          const color = view.getUint8(currentOffset++)
          if (x < fw && fy + y < actualHeight && fx + x < actualWidth) {
            canvasData[(fy + y) * actualWidth + (fx + x)] = color
          }
          x++
        }
      }
    }
  }

    return { width: actualWidth, height: actualHeight, data: canvasData, frameCount }
  } catch (err) {
    console.error(`[GRP Decoder] Failed: ${err.message}`)
    throw err
  }
}

function generateColorRamp(r, g, b) {
  const ramp = [];
  for(let i = 0; i < 8; i++) {
    const f = 1.0 - (i / 7) * 0.75; 
    ramp.push([Math.round(r * f), Math.round(g * f), Math.round(b * f)]);
  }
  return ramp;
}

export const PLAYER_COLORS = {
  Red: generateColorRamp(244, 4, 4),
  Blue: generateColorRamp(12, 72, 204),
  Teal: generateColorRamp(44, 180, 148),
  Purple: generateColorRamp(136, 64, 156),
  Orange: generateColorRamp(248, 140, 20),
  Brown: generateColorRamp(112, 48, 20),
  White: generateColorRamp(212, 212, 236),
  Yellow: generateColorRamp(252, 252, 56)
};

/**
 * Render decoded GRP frame to canvas
 * 
 * VB logic (GRPModule.vb DrawGRP, lines 576-614):
 *   - Player color: palette indices 8-15 remapped (only when isremapping = False)
 *   - RemappingNum: fire/explosion transparency cutoffs
 *   - DrawFunction 10: shadow rendering
 * 
 * @param playerColor - string name (e.g. "Red") or legacy ramp array
 */
export function renderToCanvas(ctx, decoded, palette, playerColor = null, drawFunction = 0, remappingNum = 0) {
  const { width, height, data } = decoded
  const imgData = ctx.createImageData(width, height)
  
  // VB: isremapping flag (GRPModule.vb line 579)
  // fire/explosion palettes should NOT have player color applied
  const isRemapping = (drawFunction === 9 && remappingNum >= 1 && remappingNum <= 4)

  // Resolve player color ramp (accept both string name and array)
  let playerColorRamp = null
  if (playerColor && !isRemapping) {
    if (typeof playerColor === 'string') {
      playerColorRamp = PLAYER_COLORS[playerColor] || null
    } else if (Array.isArray(playerColor)) {
      playerColorRamp = playerColor
    }
  }

  const isWpe = palette && palette.length >= 1024
  const paletteStride = isWpe ? 4 : 3

  for (let i = 0; i < width * height; i++) {
    const colorIdx = data[i]
    const base = i * 4

    // Transparency check
    let isTransparent = colorIdx === 0
    // VB: RemappingNum-specific transparency (lines 587-599)
    if (drawFunction === 9) {
      if ((remappingNum === 1 || remappingNum === 4) && colorIdx > 64) isTransparent = true
      else if (remappingNum === 3 && colorIdx > 41) isTransparent = true
      else if (remappingNum === 2 && colorIdx > 33) isTransparent = true
    }

    if (isTransparent) {
      imgData.data[base + 0] = 0
      imgData.data[base + 1] = 0
      imgData.data[base + 2] = 0
      imgData.data[base + 3] = 0
    } else if (drawFunction === 10) {
      // Shadow: black with 50% opacity
      imgData.data[base + 0] = 0
      imgData.data[base + 1] = 0
      imgData.data[base + 2] = 0
      imgData.data[base + 3] = 128
    } else if (drawFunction === 9) {
      // Engine glow / fire effects: additive blending approximation
      // In StarCraft, these use additive blend mode (colors ADD to background)
      // We approximate by using the palette color with alpha proportional to brightness
      if (palette && (colorIdx * paletteStride + 2) < palette.length) {
        const r = palette[colorIdx * paletteStride + 0]
        const g = palette[colorIdx * paletteStride + 1]
        const b = palette[colorIdx * paletteStride + 2]
        // Brighter pixels = more visible glow
        const brightness = Math.max(r, g, b)
        imgData.data[base + 0] = r
        imgData.data[base + 1] = g
        imgData.data[base + 2] = b
        imgData.data[base + 3] = Math.min(255, brightness + 60)
      }
    } else if (playerColorRamp && colorIdx >= 8 && colorIdx <= 15) {
      // VB: Player color override (indices 8-15)
      // Only applied when isremapping = False
      const rampColor = playerColorRamp[colorIdx - 8]
      imgData.data[base + 0] = rampColor[0]
      imgData.data[base + 1] = rampColor[1]
      imgData.data[base + 2] = rampColor[2]
      imgData.data[base + 3] = 255
    } else {
      // Normal palette lookup
      if (palette && (colorIdx * paletteStride + 2) < palette.length) {
        imgData.data[base + 0] = palette[colorIdx * paletteStride + 0]
        imgData.data[base + 1] = palette[colorIdx * paletteStride + 1]
        imgData.data[base + 2] = palette[colorIdx * paletteStride + 2]
        imgData.data[base + 3] = 255
      } else {
        const brightness = (colorIdx === 0) ? 0 : colorIdx
        imgData.data[base + 0] = brightness
        imgData.data[base + 1] = brightness
        imgData.data[base + 2] = brightness
        imgData.data[base + 3] = (colorIdx === 0) ? 0 : 255
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0)
}

