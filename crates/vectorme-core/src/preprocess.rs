use image::RgbaImage;

/// Composite an RGBA image over a white background.
pub fn flatten_on_white(image: &RgbaImage) -> RgbaImage {
    let mut out = image.clone();
    for pixel in out.pixels_mut() {
        let alpha = pixel[3] as f32 / 255.0;
        pixel[0] = (pixel[0] as f32 * alpha + 255.0 * (1.0 - alpha)).round() as u8;
        pixel[1] = (pixel[1] as f32 * alpha + 255.0 * (1.0 - alpha)).round() as u8;
        pixel[2] = (pixel[2] as f32 * alpha + 255.0 * (1.0 - alpha)).round() as u8;
        pixel[3] = 255;
    }
    out
}

/// True when at least one pixel is meaningfully transparent.
pub fn has_transparency(image: &RgbaImage, threshold: u8) -> bool {
    image.pixels().any(|pixel| pixel[3] < threshold)
}

/// True when transparency is present but not fully binary. VTracer keys fully
/// transparent pixels; soft edges are not represented as SVG opacity.
pub fn has_soft_alpha(image: &RgbaImage, threshold: u8) -> bool {
    image
        .pixels()
        .any(|pixel| pixel[3] > threshold && pixel[3] < 255 - threshold)
}
