use std::path::PathBuf;

use vectorme_core::{ImagePreview, TraceOptions, TraceResult};

#[tauri::command]
pub async fn load_image_preview(
    path: String,
    max_dimension: Option<u32>,
) -> Result<ImagePreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        vectorme_core::load_preview(&PathBuf::from(path), max_dimension.unwrap_or(1600))
    })
    .await
    .map_err(|error| format!("Task was cancelled: {error}"))?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn trace_image(path: String, options: TraceOptions) -> Result<TraceResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        vectorme_core::trace_file(&PathBuf::from(path), &options)
    })
    .await
    .map_err(|error| format!("Task was cancelled: {error}"))?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_svg(path: String, svg: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.is_dir() {
            return Err(format!(
                "Target directory does not exist: {}",
                parent.display()
            ));
        }
    }
    std::fs::write(&path, svg)
        .map_err(|error| format!("Cannot save file {}: {error}", path.display()))
}
