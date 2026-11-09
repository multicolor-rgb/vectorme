use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum TraceError {
    #[error("Cannot open file: {0}")]
    Io(#[from] std::io::Error),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Unsupported or corrupted image: {0}")]
    Image(#[from] image::ImageError),

    #[error("Failed to decode image: {0}")]
    Decode(String),

    #[error("Vectorization failed: {0}")]
    Engine(String),

    #[error("Cannot save file {path}: {source}")]
    Save {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
}
