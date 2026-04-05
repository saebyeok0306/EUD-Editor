pub mod common;
pub mod grp;
pub mod iscript_json;
pub mod dat;
pub mod tbl;

// Re-export WASM functions for easy access
pub use grp::{decode_grp_frame, render_grp_frame};
pub use iscript_json::{init_iscript_data, step_iscript_logic, get_iscript_label, IscriptState};
pub use dat::parse_dat;
pub use tbl::parse_tbl;
