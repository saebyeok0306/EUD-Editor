use wasm_bindgen::prelude::*;
use js_sys::{Object, Reflect, Uint8Array};

pub fn decode_grp_frame_internal(buffer: &[u8], frame_index: u16) -> Result<(usize, usize, u16, Vec<u8>), String> {
    if buffer.len() < 6 {
        return Err("Buffer too small for GRP header".to_string());
    }

    let frame_count = u16::from_le_bytes([buffer[0], buffer[1]]);
    let width = u16::from_le_bytes([buffer[2], buffer[3]]);
    let height = u16::from_le_bytes([buffer[4], buffer[5]]);

    let mut actual_frame_index = frame_index;
    if frame_count > 0 && frame_index >= frame_count {
        actual_frame_index = frame_index % frame_count;
    } else if frame_index >= frame_count {
        return Err(format!("Frame index {} out of bounds ({})", frame_index, frame_count));
    }

    let frame_table_offset = 6 + (actual_frame_index as usize) * 8;
    if frame_table_offset + 8 > buffer.len() {
        return Err(format!("Frame table offset {} out of bounds", frame_table_offset));
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
        return Err(format!("Frame data offset {} out of bounds", frame_offset));
    }

    let actual_width = std::cmp::max(width as usize, fx + fw);
    let actual_height = std::cmp::max(height as usize, fy + fh);

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
                x += (b - 0x80) as usize;
            } else if b >= 0x40 {
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

    Ok((actual_width, actual_height, frame_count, canvas_data))
}

#[wasm_bindgen]
pub fn render_grp_frame(
    buffer: &[u8],
    frame_index: u16,
    palette: Option<Vec<u8>>,
    player_color: Option<Vec<u8>>,
    draw_function: u8,
    remapping_num: u8,
) -> Result<Object, JsValue> {
    let (width, height, frame_count, data) = decode_grp_frame_internal(buffer, frame_index)
        .map_err(|e| JsValue::from_str(&e))?;

    let is_remapping = draw_function == 9 && remapping_num >= 1 && remapping_num <= 4;
    
    let use_player_color = match &player_color {
        Some(p) => !is_remapping && p.len() >= 24,
        None => false,
    };

    let p_stride = match &palette {
        Some(p) if p.len() >= 1024 => 4,
        Some(_) => 3,
        None => 3,
    };

    let mut img_data = vec![0u8; width * height * 4];

    for i in 0..(width * height) {
        let color_idx = data[i] as usize;
        let base = i * 4;

        let mut is_transparent = color_idx == 0;
        if draw_function == 9 {
            if (remapping_num == 1 || remapping_num == 4) && color_idx > 64 {
                is_transparent = true;
            } else if remapping_num == 3 && color_idx > 41 {
                is_transparent = true;
            } else if remapping_num == 2 && color_idx > 33 {
                is_transparent = true;
            }
        }

        if is_transparent {
            img_data[base + 0] = 0;
            img_data[base + 1] = 0;
            img_data[base + 2] = 0;
            img_data[base + 3] = 0;
        } else if draw_function == 10 {
            img_data[base + 0] = 0;
            img_data[base + 1] = 0;
            img_data[base + 2] = 0;
            img_data[base + 3] = 128; // 50% opacity
        } else if draw_function == 9 {
            if let Some(p) = &palette {
                if color_idx * p_stride + 2 < p.len() {
                    let r = p[color_idx * p_stride + 0];
                    let g = p[color_idx * p_stride + 1];
                    let b = p[color_idx * p_stride + 2];
                    let brightness = r.max(g).max(b);
                    img_data[base + 0] = r;
                    img_data[base + 1] = g;
                    img_data[base + 2] = b;
                    let a = (brightness as u16 + 60).min(255) as u8;
                    img_data[base + 3] = a;
                }
            }
        } else if use_player_color && color_idx >= 8 && color_idx <= 15 {
            if let Some(pc) = &player_color {
                let idx = color_idx - 8;
                img_data[base + 0] = pc[idx * 3 + 0];
                img_data[base + 1] = pc[idx * 3 + 1];
                img_data[base + 2] = pc[idx * 3 + 2];
                img_data[base + 3] = 255;
            }
        } else {
            if let Some(p) = &palette {
                if color_idx * p_stride + 2 < p.len() {
                    img_data[base + 0] = p[color_idx * p_stride + 0];
                    img_data[base + 1] = p[color_idx * p_stride + 1];
                    img_data[base + 2] = p[color_idx * p_stride + 2];
                    img_data[base + 3] = 255;
                }
            } else {
                let brightness = if color_idx == 0 { 0 } else { color_idx as u8 };
                img_data[base + 0] = brightness;
                img_data[base + 1] = brightness;
                img_data[base + 2] = brightness;
                img_data[base + 3] = if color_idx == 0 { 0 } else { 255 };
            }
        }
    }

    let obj = Object::new();
    let data_arr = Uint8Array::from(&img_data[..]);
    
    Reflect::set(&obj, &JsValue::from_str("width"), &JsValue::from(width as u16))?;
    Reflect::set(&obj, &JsValue::from_str("height"), &JsValue::from(height as u16))?;
    Reflect::set(&obj, &JsValue::from_str("frameCount"), &JsValue::from(frame_count))?;
    Reflect::set(&obj, &JsValue::from_str("data"), &JsValue::from(data_arr))?;

    Ok(obj)
}

#[wasm_bindgen]
pub fn decode_grp_frame(buffer: &[u8], frame_index: u16) -> Result<Object, JsValue> {
    let (width, height, frame_count, data) = decode_grp_frame_internal(buffer, frame_index)
        .map_err(|e| JsValue::from_str(&e))?;

    let obj = Object::new();
    let data_arr = Uint8Array::from(&data[..]);
    
    Reflect::set(&obj, &JsValue::from_str("width"), &JsValue::from(width as u16))?;
    Reflect::set(&obj, &JsValue::from_str("height"), &JsValue::from(height as u16))?;
    Reflect::set(&obj, &JsValue::from_str("frameCount"), &JsValue::from(frame_count))?;
    Reflect::set(&obj, &JsValue::from_str("data"), &JsValue::from(data_arr))?;

    Ok(obj)
}
