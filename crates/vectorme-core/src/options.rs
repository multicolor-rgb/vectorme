use serde::{Deserialize, Serialize};
use visioncortex::PathSimplifyMode;
use vtracer::{ColorMode as VtColorMode, Config, Hierarchical as VtHierarchical};

/// A coarse starting point. Individual fields can still be overridden.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Preset {
    #[default]
    Logo,
    Bw,
    Photo,
    Custom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ColorMode {
    #[default]
    Color,
    Binary,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Hierarchical {
    #[default]
    Stacked,
    Cutout,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum CurveMode {
    #[default]
    Spline,
    Polygon,
}

/// Everything the UI can tune. Values are clamped in [`TraceOptions::to_config`]
/// so a malformed request can never panic the tracing engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct TraceOptions {
    pub preset: Preset,
    pub color_mode: ColorMode,
    pub hierarchical: Hierarchical,
    pub filter_speckle: usize,
    pub color_precision: i32,
    pub layer_difference: i32,
    pub corner_threshold: i32,
    pub length_threshold: f64,
    pub max_iterations: usize,
    pub splice_threshold: i32,
    pub path_precision: u32,
    pub mode: CurveMode,
    pub preserve_transparency: bool,
    /// Longest edge of the image handed to the tracer. `0` disables the guard.
    pub max_dimension: u32,
}

impl Default for TraceOptions {
    fn default() -> Self {
        Self::for_preset(Preset::Logo)
    }
}

impl TraceOptions {
    pub fn for_preset(preset: Preset) -> Self {
        match preset {
            Preset::Bw => Self {
                preset,
                color_mode: ColorMode::Binary,
                hierarchical: Hierarchical::Stacked,
                filter_speckle: 4,
                color_precision: 6,
                layer_difference: 16,
                corner_threshold: 60,
                length_threshold: 4.0,
                max_iterations: 10,
                splice_threshold: 45,
                path_precision: 2,
                mode: CurveMode::Spline,
                preserve_transparency: true,
                max_dimension: 3000,
            },
            Preset::Photo => Self {
                preset,
                color_mode: ColorMode::Color,
                hierarchical: Hierarchical::Stacked,
                filter_speckle: 10,
                color_precision: 8,
                layer_difference: 48,
                corner_threshold: 180,
                length_threshold: 4.0,
                max_iterations: 10,
                splice_threshold: 45,
                path_precision: 2,
                mode: CurveMode::Spline,
                preserve_transparency: true,
                max_dimension: 2500,
            },
            // Logo is also the fallback for Custom.
            Preset::Logo | Preset::Custom => Self {
                preset,
                color_mode: ColorMode::Color,
                hierarchical: Hierarchical::Stacked,
                filter_speckle: 4,
                color_precision: 8,
                layer_difference: 16,
                corner_threshold: 60,
                length_threshold: 4.0,
                max_iterations: 10,
                splice_threshold: 45,
                path_precision: 2,
                mode: CurveMode::Spline,
                preserve_transparency: true,
                max_dimension: 3000,
            },
        }
    }

    pub(crate) fn to_config(&self) -> Config {
        Config {
            color_mode: match self.color_mode {
                ColorMode::Color => VtColorMode::Color,
                ColorMode::Binary => VtColorMode::Binary,
            },
            hierarchical: match self.hierarchical {
                Hierarchical::Stacked => VtHierarchical::Stacked,
                Hierarchical::Cutout => VtHierarchical::Cutout,
            },
            filter_speckle: self.filter_speckle.min(64),
            color_precision: self.color_precision.clamp(1, 8),
            layer_difference: self.layer_difference.clamp(0, 255),
            mode: match self.mode {
                CurveMode::Spline => PathSimplifyMode::Spline,
                CurveMode::Polygon => PathSimplifyMode::Polygon,
            },
            corner_threshold: self.corner_threshold.clamp(0, 180),
            length_threshold: self.length_threshold.clamp(0.5, 20.0),
            max_iterations: self.max_iterations.clamp(1, 50),
            splice_threshold: self.splice_threshold.clamp(0, 90),
            path_precision: Some(self.path_precision.min(6)),
        }
    }
}
