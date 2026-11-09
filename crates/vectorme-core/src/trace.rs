use std::path::Path;
use std::time::Instant;

use serde::Serialize;
use vtracer::ColorImage;

use crate::decode;
use crate::error::TraceError;
use crate::options::TraceOptions;
use crate::preprocess;
use crate::svg;
use crate::warning::TraceWarning;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceResult {
    pub svg: String,
    pub width: u32,
    pub height: u32,
    pub source_width: u32,
    pub source_height: u32,
    pub path_count: usize,
    pub byte_size: usize,
    pub elapsed_ms: u64,
    pub colors: Vec<String>,
    pub warnings: Vec<TraceWarning>,
}

pub fn trace_file(path: &Path, options: &TraceOptions) -> Result<TraceResult, TraceError> {
    let started = Instant::now();
    let loaded = decode::load(path, options.max_dimension)?;

    let mut warnings = loaded.warnings;
    let source_width = loaded.source_width;
    let source_height = loaded.source_height;
    let width = loaded.image.width();
    let height = loaded.image.height();

    let transparent = preprocess::has_transparency(&loaded.image, 8);
    let soft_alpha = preprocess::has_soft_alpha(&loaded.image, 8);

    let image = if options.preserve_transparency {
        if soft_alpha {
            warnings.push(TraceWarning::SoftAlpha);
        }
        loaded.image
    } else {
        if transparent {
            warnings.push(TraceWarning::TransparencyFlattened);
        }
        preprocess::flatten_on_white(&loaded.image)
    };

    let color_image = ColorImage {
        pixels: image.into_raw(),
        width: width as usize,
        height: height as usize,
    };

    let raw_svg = vtracer::convert(color_image, options.to_config())
        .map_err(TraceError::Engine)?
        .to_string();

    let svg = svg::finalize(&raw_svg, width, height, source_width, source_height);
    let (path_count, colors) = svg::analyze(&svg);

    if path_count == 0 {
        warnings.push(TraceWarning::NoPaths);
    }

    Ok(TraceResult {
        byte_size: svg.len(),
        svg,
        width,
        height,
        source_width,
        source_height,
        path_count,
        elapsed_ms: started.elapsed().as_millis() as u64,
        colors,
        warnings,
    })
}
