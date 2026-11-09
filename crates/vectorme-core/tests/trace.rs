use std::path::PathBuf;

use vectorme_core::{load_preview, trace_file, Preset, TraceOptions, TraceWarning};

fn fixture(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}

#[test]
fn traces_logo_to_valid_svg() {
    let options = TraceOptions::for_preset(Preset::Logo);
    let result = trace_file(&fixture("logo.png"), &options).expect("tracing failed");

    assert_eq!(result.width, 256);
    assert_eq!(result.height, 256);
    assert_eq!(result.source_width, 256);
    assert!(result.path_count > 0, "expected at least one path");
    assert!(result.svg.contains("viewBox=\"0 0 256 256\""));
    assert!(result.svg.starts_with("<?xml"));
    assert!(result.svg.contains("<path"));
    assert!(!result.colors.is_empty());
    assert!(result.byte_size > 100);
}

#[test]
fn binary_preset_emits_black_paths_only() {
    let options = TraceOptions::for_preset(Preset::Bw);
    let result = trace_file(&fixture("logo.png"), &options).expect("tracing failed");

    assert!(result.path_count > 0);
    assert_eq!(result.colors, vec!["#000000".to_string()]);
}

#[test]
fn resize_guard_limits_tracing_dimensions() {
    let mut options = TraceOptions::for_preset(Preset::Logo);
    options.max_dimension = 64;

    let result = trace_file(&fixture("logo.png"), &options).expect("tracing failed");

    assert!(result.width <= 64);
    assert!(result.height <= 64);
    assert_eq!(result.source_width, 256);
    assert!(result.svg.contains("viewBox=\"0 0 64 64\""));
    assert!(result.svg.contains("width=\"256\" height=\"256\""));
    assert!(result
        .warnings
        .iter()
        .any(|warning| matches!(warning, TraceWarning::Downscaled { .. })));
}

#[test]
fn transparency_is_flattened_when_requested() {
    let mut options = TraceOptions::for_preset(Preset::Logo);
    options.preserve_transparency = false;

    let result = trace_file(&fixture("alpha.png"), &options).expect("tracing failed");

    assert!(result.path_count > 0);
    assert!(result
        .warnings
        .iter()
        .any(|warning| matches!(warning, TraceWarning::TransparencyFlattened)));
}

#[test]
fn preview_returns_png_data_url() {
    let preview = load_preview(&fixture("photo.jpg"), 120).expect("preview failed");

    assert!(preview.data_url.starts_with("data:image/png;base64,"));
    assert!(preview.width <= 120);
    assert_eq!(preview.source_width, 320);
    assert_eq!(preview.source_height, 240);
}

#[test]
fn missing_file_is_reported() {
    let error = trace_file(&fixture("does-not-exist.png"), &TraceOptions::default())
        .expect_err("expected an error");

    assert!(error.to_string().contains("File not found"));
}
