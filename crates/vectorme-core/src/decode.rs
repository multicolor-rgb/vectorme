use std::io::Cursor;
use std::path::Path;

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader, RgbaImage};
use serde::Serialize;

use crate::error::TraceError;
use crate::warning::TraceWarning;

pub struct LoadedImage {
    pub image: RgbaImage,
    pub source_width: u32,
    pub source_height: u32,
    pub warnings: Vec<TraceWarning>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImagePreview {
    pub data_url: String,
    pub width: u32,
    pub height: u32,
    pub source_width: u32,
    pub source_height: u32,
}

pub fn load(path: &Path, max_dimension: u32) -> Result<LoadedImage, TraceError> {
    if !path.is_file() {
        return Err(TraceError::NotFound(path.display().to_string()));
    }

    let reader = ImageReader::open(path)?.with_guessed_format()?;

    if reader.format().is_none() {
        return Err(TraceError::Decode(format!(
            "unrecognized file format: {}",
            path.display()
        )));
    }

    let mut decoder = reader.into_decoder()?;
    let orientation = decoder
        .orientation()
        .unwrap_or(image::metadata::Orientation::NoTransforms);
    let mut image = DynamicImage::from_decoder(decoder)?;
    image.apply_orientation(orientation);

    let source_width = image.width();
    let source_height = image.height();
    let mut warnings = Vec::new();

    if source_width == 0 || source_height == 0 {
        return Err(TraceError::Decode("image has zero size".into()));
    }

    if max_dimension > 0 {
        let longest = source_width.max(source_height);
        if longest > max_dimension {
            let scale = max_dimension as f64 / longest as f64;
            let width = ((source_width as f64 * scale).round() as u32).max(1);
            let height = ((source_height as f64 * scale).round() as u32).max(1);
            image = image.resize_exact(width, height, image::imageops::FilterType::Lanczos3);
            warnings.push(TraceWarning::Downscaled {
                from_width: source_width,
                from_height: source_height,
                to_width: width,
                to_height: height,
            });
        }
    }

    Ok(LoadedImage {
        image: image.to_rgba8(),
        source_width,
        source_height,
        warnings,
    })
}

pub fn load_preview(path: &Path, max_dimension: u32) -> Result<ImagePreview, TraceError> {
    let loaded = load(path, max_dimension)?;
    let width = loaded.image.width();
    let height = loaded.image.height();

    let mut bytes = Cursor::new(Vec::new());
    DynamicImage::ImageRgba8(loaded.image).write_to(&mut bytes, ImageFormat::Png)?;
    let encoded = BASE64.encode(bytes.into_inner());

    Ok(ImagePreview {
        data_url: format!("data:image/png;base64,{encoded}"),
        width,
        height,
        source_width: loaded.source_width,
        source_height: loaded.source_height,
    })
}
