import type { TranslationKey } from "../i18n";
import type { PresetId, TraceOptions } from "../types";

const shared: Omit<TraceOptions, "preset"> = {
  colorMode: "color",
  hierarchical: "stacked",
  filterSpeckle: 4,
  colorPrecision: 8,
  layerDifference: 16,
  cornerThreshold: 60,
  lengthThreshold: 4,
  maxIterations: 10,
  spliceThreshold: 45,
  pathPrecision: 2,
  mode: "spline",
  preserveTransparency: true,
  maxDimension: 3000,
};

export interface PresetDefinition {
  id: Exclude<PresetId, "custom">;
  labelKey: TranslationKey;
  taglineKey: TranslationKey;
  options: TraceOptions;
}

export const PRESETS: Record<Exclude<PresetId, "custom">, PresetDefinition> = {
  logo: {
    id: "logo",
    labelKey: "preset.logo",
    taglineKey: "preset.logoTagline",
    options: { ...shared, preset: "logo" },
  },
  bw: {
    id: "bw",
    labelKey: "preset.bw",
    taglineKey: "preset.bwTagline",
    options: {
      ...shared,
      preset: "bw",
      colorMode: "binary",
      colorPrecision: 6,
    },
  },
  photo: {
    id: "photo",
    labelKey: "preset.photo",
    taglineKey: "preset.photoTagline",
    options: {
      ...shared,
      preset: "photo",
      filterSpeckle: 10,
      layerDifference: 48,
      cornerThreshold: 180,
      maxDimension: 2500,
    },
  },
};

export const PRESET_LIST = [PRESETS.logo, PRESETS.bw, PRESETS.photo];
