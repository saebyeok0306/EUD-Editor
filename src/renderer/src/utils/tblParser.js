import init, { parse_tbl } from '../wasm/rust_grp.js'
import wasmUrl from '../wasm/rust_grp_bg.wasm?url'

/**
 * tblParser.js
 *
 * Parser for StarCraft 1 TBL binary files, now fully optimized with Rust WASM.
 * Exposes the same async interface as before for compatibility.
 */

let wasmInitPromise = null

export async function parseTbl(arrayBuffer, encoding = 'EUC-KR') {
  if (!wasmInitPromise) {
    wasmInitPromise = init(wasmUrl)
  }
  await wasmInitPromise

  const bytes = new Uint8Array(arrayBuffer)
  
  // parse_tbl returns js_sys::Array (string[])
  return parse_tbl(bytes, encoding)
}
