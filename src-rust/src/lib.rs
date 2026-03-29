use wasm_bindgen::prelude::*;
use js_sys::{Object, Reflect, Uint8Array};

#[wasm_bindgen]
pub fn decode_grp_frame(buffer: &[u8], frame_index: u16) -> Result<Object, JsValue> {
    if buffer.len() < 6 {
        return Err(JsValue::from_str("Buffer too small for GRP header"));
    }

    let frame_count = u16::from_le_bytes([buffer[0], buffer[1]]);
    let width = u16::from_le_bytes([buffer[2], buffer[3]]);
    let height = u16::from_le_bytes([buffer[4], buffer[5]]);

    if frame_index >= frame_count {
        return Err(JsValue::from_str(&format!(
            "Frame index {} out of bounds ({})",
            frame_index, frame_count
        )));
    }

    let frame_table_offset = 6 + (frame_index as usize) * 8;
    if frame_table_offset + 8 > buffer.len() {
        return Err(JsValue::from_str(&format!(
            "Frame table offset {} out of bounds",
            frame_table_offset
        )));
    }

    let fx = buffer[frame_table_offset] as usize;
    let fy = buffer[frame_table_offset + 1] as usize;
    let fw = buffer[frame_table_offset + 2] as usize;
    let fh = buffer[frame_table_offset + 3] as usize;
    let mut frame_offset = u32::from_le_bytes([
        buffer[frame_table_offset + 4],
        buffer[frame_table_offset + 5],
        buffer[frame_table_offset + 6],
        buffer[frame_table_offset + 7],
    ]) as usize;

    frame_offset = frame_offset & 0x0FFFFFFF;

    if frame_offset + 2 * fh > buffer.len() {
        return Err(JsValue::from_str(&format!(
            "Frame data offset {} out of bounds",
            frame_offset
        )));
    }

    // StarCraft GRP frame width/height can legally exceed global bounding box limits.
    // We adjust the canvas size dynamically instead of throwing an error.
    let actual_width = std::cmp::max(width as usize, fx + fw);
    let actual_height = std::cmp::max(height as usize, fy + fh);

    // Allocate frame
    let mut canvas_data = vec![0u8; actual_width * actual_height];
    let line_offsets = frame_offset;

    let buf_len = buffer.len();

    for y in 0..fh {
        let lo_idx = line_offsets + y * 2;
        let line_offset = u16::from_le_bytes([buffer[lo_idx], buffer[lo_idx + 1]]) as usize;
        let mut current_offset = frame_offset + line_offset;
        let mut x = 0;

        while x < fw {
            if current_offset >= buf_len {
                break;
            }
            let b = buffer[current_offset];
            current_offset += 1;

            if b >= 0x80 {
                // Skip
                x += (b - 0x80) as usize;
            } else if b >= 0x40 {
                // Repeat
                let count = (b - 0x40) as usize;
                if current_offset >= buf_len {
                    break;
                }
                let color = buffer[current_offset];
                current_offset += 1;

                for _ in 0..count {
                    if x < fw && (fy + y) < actual_height && (fx + x) < actual_width {
                        canvas_data[(fy + y) * actual_width + (fx + x)] = color;
                    }
                    x += 1;
                }
            } else {
                // Raw
                let count = b as usize;
                for _ in 0..count {
                    if current_offset >= buf_len {
                        break;
                    }
                    let color = buffer[current_offset];
                    current_offset += 1;
                    if x < fw && (fy + y) < actual_height && (fx + x) < actual_width {
                        canvas_data[(fy + y) * actual_width + (fx + x)] = color;
                    }
                    x += 1;
                }
            }
        }
    }

    let obj = Object::new();
    let data_arr = Uint8Array::from(&canvas_data[..]);
    
    Reflect::set(&obj, &JsValue::from_str("width"), &JsValue::from(actual_width as u16))?;
    Reflect::set(&obj, &JsValue::from_str("height"), &JsValue::from(actual_height as u16))?;
    Reflect::set(&obj, &JsValue::from_str("frameCount"), &JsValue::from(frame_count))?;
    Reflect::set(&obj, &JsValue::from_str("data"), &JsValue::from(data_arr))?;

    Ok(obj)
}
