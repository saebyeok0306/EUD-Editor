use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use std::collections::HashMap;

#[derive(Default)]
struct DatFormat {
    name: String,
    size: usize,
    var_start: Option<usize>,
    var_end: Option<usize>,
}

#[wasm_bindgen]
pub fn parse_dat(def_text: &str, dat_buffer: &[u8]) -> Result<Array, JsValue> {
    let mut input_entry_count = 228;
    let mut var_count = 0;
    
    let mut formats: HashMap<usize, DatFormat> = HashMap::new();
    let mut current_section = "";
    
    for line in def_text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }
        
        if line.starts_with('[') && line.ends_with(']') {
            current_section = &line[1..line.len()-1];
            continue;
        }
        
        if let Some(eq_idx) = line.find('=') {
            let key = line[..eq_idx].trim();
            let val = line[eq_idx+1..].trim();
            
            if current_section == "HEADER" {
                if key == "InputEntrycount" {
                    input_entry_count = val.parse::<usize>().unwrap_or(228);
                } else if key == "Varcount" {
                    var_count = val.parse::<usize>().unwrap_or(0);
                }
            } else if current_section == "FORMAT" {
                let idx_end = key.find(|c: char| !c.is_ascii_digit()).unwrap_or(key.len());
                if idx_end > 0 {
                    if let Ok(id) = key[..idx_end].parse::<usize>() {
                        let prop = &key[idx_end..];
                        let fmt = formats.entry(id).or_insert_with(|| DatFormat {
                            name: String::new(),
                            size: 4,
                            var_start: None,
                            var_end: None,
                        });
                        
                        match prop {
                            "Name" => fmt.name = val.to_string(),
                            "Size" => fmt.size = val.parse::<usize>().unwrap_or(4),
                            "VarStart" => fmt.var_start = Some(val.parse::<usize>().unwrap_or(0)),
                            "VarEnd" => fmt.var_end = Some(val.parse::<usize>().unwrap_or(0)),
                            _ => {}
                        }
                    }
                }
            }
        }
    }
    
    let mut offset = 0;
    let mut matrix = vec![HashMap::new(); input_entry_count];
    
    for i in 0..var_count {
        if let Some(fmt) = formats.get(&i) {
            let start = fmt.var_start.unwrap_or(0);
            let end = fmt.var_end.unwrap_or(input_entry_count.saturating_sub(1));
            let size = fmt.size;
            
            for index in start..=end {
                let mut value: u32 = 0;
                
                if offset + size <= dat_buffer.len() {
                    match size {
                        1 => value = dat_buffer[offset] as u32,
                        2 => value = u16::from_le_bytes([dat_buffer[offset], dat_buffer[offset+1]]) as u32,
                        4 => value = u32::from_le_bytes([dat_buffer[offset], dat_buffer[offset+1], dat_buffer[offset+2], dat_buffer[offset+3]]),
                        _ => {}
                    }
                }
                
                offset += size;
                
                if index < input_entry_count {
                    matrix[index].insert(fmt.name.clone(), value);
                }
            }
        }
    }
    
    let js_array = Array::new_with_length(input_entry_count as u32);
    
    for (i, entry) in matrix.into_iter().enumerate() {
        let obj = Object::new();
        let _ = Reflect::set(&obj, &JsValue::from_str("id"), &JsValue::from_f64(i as f64));
        
        for (k, v) in entry {
            let _ = Reflect::set(&obj, &JsValue::from_str(&k), &JsValue::from_f64(v as f64));
        }
        
        js_array.set(i as u32, obj.into());
    }
    
    Ok(js_array)
}
