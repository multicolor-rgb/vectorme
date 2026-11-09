use serde::Serialize;

/// Machine-readable warnings. The UI is responsible for turning these into
/// localized messages, so the core does not need to know the active language.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "code",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum TraceWarning {
    Downscaled {
        from_width: u32,
        from_height: u32,
        to_width: u32,
        to_height: u32,
    },
    SoftAlpha,
    TransparencyFlattened,
    NoPaths,
}
