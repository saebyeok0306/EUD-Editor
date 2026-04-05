use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use js_sys::{Array, Object, Reflect};
use lazy_static::lazy_static;

#[derive(Serialize, Deserialize, Clone)]
pub struct IscriptOpcode {
    pub opcode: String,
    pub args: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct IscriptHeader {
    pub is_id: u16,
    pub type_: Option<u8>,
    pub entry_points: HashMap<String, Option<String>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct IscriptData {
    pub headers: Vec<IscriptHeader>,
    pub labels: HashMap<String, Vec<IscriptOpcode>>,
}

lazy_static! {
    static ref GLOBAL_ISCRIPT_DATA: RwLock<Option<IscriptData>> = RwLock::new(None);
}

#[wasm_bindgen]
pub fn init_iscript_data(json_str: &str) -> Result<(), JsValue> {
    match serde_json::from_str::<IscriptData>(json_str) {
        Ok(data) => {
            let mut global_data = GLOBAL_ISCRIPT_DATA.write().unwrap();
            *global_data = Some(data);
            Ok(())
        }
        Err(e) => Err(JsValue::from_str(&format!("Failed to parse JSON: {}", e))),
    }
}

#[wasm_bindgen]
pub fn get_iscript_label(iscript_id: u16, animation_name: &str) -> Option<String> {
    let data_guard = GLOBAL_ISCRIPT_DATA.read().unwrap();
    if let Some(data) = data_guard.as_ref() {
        if let Some(header) = data.headers.iter().find(|h| h.is_id == iscript_id) {
            if let Some(Some(label)) = header.entry_points.get(animation_name) {
                return Some(label.clone());
            }
            // Fallbacks: Try Init, Walking, or first available
            if let Some(Some(label)) = header.entry_points.get("Init") {
                return Some(label.clone());
            }
            if let Some(Some(label)) = header.entry_points.get("Walking") {
                return Some(label.clone());
            }
            for val in header.entry_points.values() {
                if let Some(label) = val {
                    return Some(label.clone());
                }
            }
        }
    }
    None
}

// Struct to pass IScript state between JS and Rust
#[wasm_bindgen]
pub struct IscriptState {
    current_label: Option<String>,
    script_index: usize,
    pub current_frame: usize,
    pub pos_x: i32,
    pub pos_y: i32,
    call_stack: Vec<(String, usize)>,
    overlays: Vec<(String, u16, i32, i32)>, // opcode, id, x, y
    pub animation_ended: bool,
}

#[wasm_bindgen]
impl IscriptState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> IscriptState {
        IscriptState {
            current_label: None,
            script_index: 0,
            current_frame: 0,
            pos_x: 0,
            pos_y: 0,
            call_stack: Vec::new(),
            overlays: Vec::new(),
            animation_ended: false,
        }
    }

    pub fn reset(&mut self, label: &str) {
        self.current_label = Some(label.to_string());
        self.script_index = 0;
        self.current_frame = 0;
        self.pos_x = 0;
        self.pos_y = 0;
        self.call_stack.clear();
        self.overlays.clear();
        self.animation_ended = false;
    }

    pub fn set_label(&mut self, label: &str) {
        self.current_label = Some(label.to_string());
        self.script_index = 0;
    }

    pub fn get_label(&self) -> Option<String> {
        self.current_label.clone()
    }

    pub fn get_script_index(&self) -> usize {
        self.script_index
    }

    pub fn set_state(&mut self, label: Option<String>, index: usize, frame: usize, x: i32, y: i32) {
        self.current_label = label;
        self.script_index = index;
        self.current_frame = frame;
        self.pos_x = x;
        self.pos_y = y;
    }

    pub fn pop_overlays(&mut self) -> js_sys::Array {
        let arr = js_sys::Array::new();
        for (opcode, id, x, y) in self.overlays.drain(..) {
            let obj = js_sys::Object::new();
            let _ = Reflect::set(&obj, &JsValue::from_str("opcode"), &JsValue::from_str(&opcode));
            let _ = Reflect::set(&obj, &JsValue::from_str("id"), &JsValue::from_f64(id as f64));
            let _ = Reflect::set(&obj, &JsValue::from_str("x"), &JsValue::from_f64(x as f64));
            let _ = Reflect::set(&obj, &JsValue::from_str("y"), &JsValue::from_f64(y as f64));
            arr.push(&obj);
        }
        arr
    }
}

// Evaluate IScript logic up to a wait or end.
// Returns the number of ticks to wait.
#[wasm_bindgen]
pub fn step_iscript_logic(state: &mut IscriptState, grp_frame_count: usize) -> i32 {
    let data_guard = GLOBAL_ISCRIPT_DATA.read().unwrap();
    let data = match data_guard.as_ref() {
        Some(d) => d,
        None => return 0,
    };

    let mut wait_ticks: i32 = 0;
    let mut execution_count = 0;

    while wait_ticks == 0 && state.current_label.is_some() && execution_count < 200 {
        execution_count += 1;
        let label = state.current_label.as_ref().unwrap().clone();
        
        let script = match data.labels.get(&label) {
            Some(s) => s,
            None => {
                state.current_label = None;
                break;
            }
        };

        if state.script_index >= script.len() {
            state.current_label = None;
            break;
        }

        let instr = &script[state.script_index];
        let opcode = instr.opcode.as_str();
        
        // Helper to parse arguments safely
        let parse_int_arg = |idx: usize| -> i32 {
            if let Some(val) = instr.args.get(idx) {
                if let Some(num) = val.as_i64() {
                    return num as i32;
                }
                if let Some(s) = val.as_str() {
                    if let Ok(num) = if s.starts_with("0x") {
                        i32::from_str_radix(&s[2..], 16)
                    } else {
                        s.parse::<i32>()
                    } {
                        return num;
                    }
                }
            }
            0
        };

        let parse_string_arg = |idx: usize| -> String {
            if let Some(val) = instr.args.get(idx) {
                if let Some(s) = val.as_str() {
                    return s.to_string();
                }
            }
            String::new()
        };

        let mut next_index = state.script_index + 1;

        match opcode {
            "playfram" => {
                let frame = parse_int_arg(0) as usize;
                state.current_frame = if grp_frame_count > 0 { frame % grp_frame_count } else { frame };
            }
            "sethorpos" => {
                let mut val = parse_int_arg(0);
                if val > 127 { val -= 256; }
                state.pos_x = val;
            }
            "setvertpos" => {
                let mut val = parse_int_arg(0);
                if val > 127 { val -= 256; }
                state.pos_y = val;
            }
            "setpos" => {
                let mut vx = parse_int_arg(0);
                let mut vy = parse_int_arg(1);
                if vx > 127 { vx -= 256; }
                if vy > 127 { vy -= 256; }
                state.pos_x = vx;
                state.pos_y = vy;
            }
            "wait" => {
                let ticks = parse_int_arg(0);
                wait_ticks = if ticks > 0 { ticks } else { 1 };
            }
            "waitrand" => {
                let min = parse_int_arg(0);
                let max = parse_int_arg(1);
                let actual_min = if min > 0 { min } else { 1 };
                let actual_max = if max > 0 { max } else { actual_min };
                // Using simple pseudo-rand since JS Math.random will resolve in JS or we can use js_sys::Math::random
                let r = js_sys::Math::random();
                wait_ticks = actual_min + ((r * ((actual_max - actual_min + 1) as f64)).floor() as i32);
            }
            "goto" => {
                let target = parse_string_arg(0);
                if data.labels.contains_key(&target) {
                    state.current_label = Some(target);
                    next_index = 0;
                } else {
                    state.current_label = None;
                }
            }
            "imgol" | "imgul" | "imgolorig" => {
                let id = parse_int_arg(0) as u16;
                let mut ox = parse_int_arg(1);
                let mut oy = parse_int_arg(2);
                if ox > 127 { ox -= 256; }
                if oy > 127 { oy -= 256; }
                if opcode == "imgolorig" {
                    ox = 0; oy = 0;
                }
                state.overlays.push((opcode.to_string(), id, ox, oy));
            }
            "imgulnextid" => {
                // In generic Rust state we might not know original ImageId?
                // For this, we can just push a magical opcode to let JS map it
                let mut ox = parse_int_arg(0);
                let mut oy = parse_int_arg(1);
                if ox > 127 { ox -= 256; }
                if oy > 127 { oy -= 256; }
                state.overlays.push(("imgulnextid".to_string(), 0, ox, oy));
            }
            "sprol" | "highsprol" | "sprul" => {
                let id = parse_int_arg(0) as u16;
                let mut ox = parse_int_arg(1);
                let mut oy = parse_int_arg(2);
                if ox > 127 { ox -= 256; }
                if oy > 127 { oy -= 256; }
                state.overlays.push((opcode.to_string(), id, ox, oy));
            }
            "end" => {
                state.current_label = None;
                state.animation_ended = true;
            }
            "randcondjmp" => {
                let chance = parse_int_arg(0) as f64;
                let target = parse_string_arg(1);
                let r = js_sys::Math::random() * 256.0;
                if r <= chance {
                    if data.labels.contains_key(&target) {
                        state.current_label = Some(target);
                        next_index = 0;
                    }
                }
            }
            "gotorepeatattk" => {
                // Just repeat the current animation from start
                next_index = 0;
            }
            "engframe" => {
                let frame = parse_int_arg(0) as usize;
                state.current_frame = if grp_frame_count > 0 { frame % grp_frame_count } else { frame };
            }
            "engset" => {
                let set_num = parse_int_arg(0) as usize;
                let frame = set_num * 17;
                state.current_frame = if grp_frame_count > 0 { frame % grp_frame_count } else { frame };
            }
            "ignorerest" => {
                state.current_label = None;
            }
            "call" => {
                let target = parse_string_arg(0);
                if data.labels.contains_key(&target) {
                    state.call_stack.push((state.current_label.clone().unwrap(), next_index));
                    state.current_label = Some(target);
                    next_index = 0;
                }
            }
            "return" => {
                if let Some((old_label, old_index)) = state.call_stack.pop() {
                    state.current_label = Some(old_label);
                    next_index = old_index;
                }
            }
            "warpoverlay" => {
                state.current_frame = parse_int_arg(0) as usize;
            }
            "followmaingraphic" => {
                // Handled partially outside, but we just advance script index
                // Wait, JS needs to draw with parent's frame? 
                // We'll let JS handle it by checking the opcode manually? 
                // We can't let JS handle it if we are evaluating block.
                // We'll add a special overlay return or just ignore it and let JS handle since parent is updated.
            }
            _ => {
                // Skip others
            }
        }
        
        // Update script index if loop didn't goto/return
        if state.current_label == Some(label) {
            state.script_index = next_index;
        }
    }

    if wait_ticks == 0 && state.current_label.is_some() {
        wait_ticks = 1;
    }

    wait_ticks
}
