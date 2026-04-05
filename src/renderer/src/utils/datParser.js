import init, { parse_dat } from '../wasm/rust_grp.js'
import wasmUrl from '../wasm/rust_grp_bg.wasm?url'

/**
 * datParser.js
 *
 * Replaces old JS DataView fallback with Rust WASM module for extreme parsing speeds.
 */

let wasmInitPromise = null

// We keep parseDef mostly as a dummy since WASM does it internally, 
// but datStore.js passes defData originally. We will just pass the raw defText to WASM directly.
export function parseDef(defText) {
  // Return raw text so that datStore can pass it as-is without changing its interface
  return { rawText: defText }
}

export async function parseDat(arrayBuffer, defData) {
  if (!wasmInitPromise) {
    wasmInitPromise = init(wasmUrl)
  }
  await wasmInitPromise

  const bytes = new Uint8Array(arrayBuffer)
  const defText = defData.rawText || ""
  
  return parse_dat(defText, bytes)
}
