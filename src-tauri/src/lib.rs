mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_image_preview,
            commands::trace_image,
            commands::save_svg,
        ])
        .run(tauri::generate_context!())
        .expect("nie można uruchomić aplikacji Vectorme");
}
