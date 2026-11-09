export type PresetId = "logo" | "bw" | "photo" | "custom";
export type ColorMode = "color" | "binary";
export type Hierarchical = "stacked" | "cutout";
export type CurveMode = "spline" | "polygon";
export type ViewerMode = "result" | "source" | "split" | "edit";

export interface TraceOptions {
  preset: PresetId;
  colorMode: ColorMode;
  hierarchical: Hierarchical;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  cornerThreshold: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  pathPrecision: number;
  mode: CurveMode;
  preserveTransparency: boolean;
  maxDimension: number;
}

export interface TraceResult {
  svg: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  pathCount: number;
  byteSize: number;
  elapsedMs: number;
  colors: string[];
  warnings: TraceWarning[];
}

export type TraceWarning =
  | {
      code: "downscaled";
      fromWidth: number;
      fromHeight: number;
      toWidth: number;
      toHeight: number;
    }
  | { code: "softAlpha" }
  | { code: "transparencyFlattened" }
  | { code: "noPaths" };

export interface ImagePreview {
  dataUrl: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export type BusyState = "load" | "trace" | null;
