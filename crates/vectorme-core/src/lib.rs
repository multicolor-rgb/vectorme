//! Vectorme tracing core.
//!
//! The crate intentionally keeps the public surface small: load an image,
//! turn it into an SVG and report a few useful statistics. UI concerns live
//! in the Tauri layer.

mod decode;
mod error;
mod options;
mod preprocess;
mod svg;
mod trace;
mod warning;

pub use decode::ImagePreview;
pub use error::TraceError;
pub use options::{ColorMode, CurveMode, Hierarchical, Preset, TraceOptions};
pub use trace::{trace_file, TraceResult};
pub use warning::TraceWarning;

/// Load a downscaled PNG preview suitable for the webview.
pub use decode::load_preview;
