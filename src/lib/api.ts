import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { ImagePreview, TraceOptions, TraceResult } from "../types";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "bmp", "gif", "tif", "tiff"];

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function pickImagePath(title: string, filterName: string): Promise<string | null> {
  const selected = await open({
    title,
    multiple: false,
    directory: false,
    filters: [{ name: filterName, extensions: IMAGE_EXTENSIONS }],
  });

  return typeof selected === "string" ? selected : null;
}

export async function pickSavePath(
  defaultPath: string,
  title: string,
  filterName: string,
): Promise<string | null> {
  const selected = await save({
    title,
    defaultPath,
    filters: [{ name: filterName, extensions: ["svg"] }],
  });

  return typeof selected === "string" ? selected : null;
}

export function loadImagePreview(path: string, maxDimension = 1600): Promise<ImagePreview> {
  return invoke<ImagePreview>("load_image_preview", { path, maxDimension });
}

export function traceImage(path: string, options: TraceOptions): Promise<TraceResult> {
  return invoke<TraceResult>("trace_image", { path, options });
}

export function saveSvg(path: string, svg: string): Promise<void> {
  return invoke<void>("save_svg", { path, svg });
}

export function svgNameFor(path: string): string {
  const stem = path.replace(/\.[^./\\]+$/, "");
  return `${stem}.svg`;
}

export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "An unknown error occurred.";
}

export function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(path);
}
