use wasm_bindgen::prelude::*;
use encoding_rs::{EUC_KR, UTF_8};
use js_sys::{Array, JsString};

#[wasm_bindgen]
pub fn parse_tbl(buffer: &[u8], encoding: &str) -> Result<Array, JsValue> {
    if buffer.len() < 2 {
        return Err(JsValue::from_str("TBL buffer too small"));
    }
    
    // Read count (number of strings, little endian)
    let count = u16::from_le_bytes([buffer[0], buffer[1]]) as usize;
    let array = Array::new();
    
    let is_euc_kr = encoding.eq_ignore_ascii_case("EUC-KR");
    
    for i in 0..count {
        let offset_ptr = 2 + i * 2;
        if offset_ptr + 1 >= buffer.len() {
            break;
        }
        
        let str_offset = u16::from_le_bytes([buffer[offset_ptr], buffer[offset_ptr + 1]]) as usize;
        
        if str_offset >= buffer.len() {
            array.push(&JsString::from(""));
            continue;
        }
        
        // Find null terminator
        let mut end = str_offset;
        while end < buffer.len() && buffer[end] != 0 {
            end += 1;
        }
        
        let slice = &buffer[str_offset..end];
        
        // Decode slice based on encoding
        let decoded_str = if is_euc_kr {
            let (res, _, _) = EUC_KR.decode(slice);
            res.into_owned()
        } else {
            let (res, _, _) = UTF_8.decode(slice);
            res.into_owned()
        };
        
        array.push(&JsString::from(decoded_str));
    }
    
    Ok(array)
}
