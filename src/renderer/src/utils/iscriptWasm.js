import init, { init_iscript_data, step_iscript_logic, get_iscript_label, IscriptState } from '../wasm/rust_grp.js'
import wasmUrl from '../wasm/rust_grp_bg.wasm?url'

let wasmReady = false

export const initIscriptWasm = async () => {
  if (!wasmReady) {
    try {
      await init(wasmUrl)
      wasmReady = true
      console.log("[IScript WASM Engine] Rust Module Loaded!")
    } catch (e) {
      console.error("[IScript WASM Engine] Load failed.", e)
    }
  }
}

// Auto-initialize
initIscriptWasm()

export function isIscriptWasmReady() {
  return wasmReady
}

export function initIscriptDataRaw(jsonStr) {
  if (!wasmReady) return false
  try {
    init_iscript_data(jsonStr)
    return true
  } catch (e) {
    console.error("[IScript WASM] Init data failed", e)
    return false
  }
}

export function getIscriptLabel(iscriptId, animationName) {
  if (!wasmReady) return null
  return get_iscript_label(iscriptId, animationName)
}

export function createIscriptState() {
  if (!wasmReady) return null
  return new IscriptState()
}

export function stepIscriptLogic(state, grpFrameCount) {
  if (!wasmReady || !state) return 1
  return step_iscript_logic(state, grpFrameCount)
}
