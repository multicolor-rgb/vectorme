import { useI18n } from "../i18n";
import type { BusyState, TraceResult } from "../types";

interface ContextBarProps {
  busy: BusyState;
  hasImage: boolean;
  hasResult: boolean;
  editing: boolean;
}

export function ContextBar({ busy, hasImage, hasResult, editing }: ContextBarProps) {
  const { t } = useI18n();

  const hint =
    busy === "load"
      ? t("context.loading")
      : busy === "trace"
        ? t("context.tracing")
        : editing
          ? t("context.edit")
          : !hasImage
            ? t("context.empty")
            : hasResult
              ? t("context.result")
              : t("context.ready");

  return (
    <div className="context-bar">
      <span className="context-icon" aria-hidden="true">
        i
      </span>
      <span>{hint}</span>
      <span className="context-spacer" />
      <span className="context-hint">{t("status.hint")}</span>
    </div>
  );
}

interface StatusBarProps {
  busy: BusyState;
  hasImage: boolean;
  sourceWidth: number | null;
  sourceHeight: number | null;
  result: TraceResult | null;
  zoom: number;
  editing: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function StatusBar({
  busy,
  hasImage,
  sourceWidth,
  sourceHeight,
  result,
  zoom,
  editing,
  onZoomIn,
  onZoomOut,
  onFit,
}: StatusBarProps) {
  const { t } = useI18n();

  const status = busy
    ? busy === "load"
      ? t("status.loading")
      : t("status.tracing")
    : editing
      ? t("status.editing")
      : hasImage
        ? t("status.ready")
        : t("status.waiting");

  return (
    <footer className="statusbar">
      <span className={`status-dot${busy ? " is-busy" : ""}`} />
      <span>{status}</span>

      {hasImage && sourceWidth && sourceHeight && (
        <>
          <span className="status-separator" />
          <span>
            {sourceWidth}×{sourceHeight} px
          </span>
        </>
      )}

      {result && (
        <>
          <span className="status-separator" />
          <span>
            {result.pathCount} {t("stats.paths")} · {result.colors.length} {t("stats.colors")}
          </span>
        </>
      )}

      <span className="status-spacer" />

      <div className="status-zoom">
        <button type="button" onClick={onZoomOut} aria-label={t("viewer.zoomOut")} disabled={!hasImage}>
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} aria-label={t("viewer.zoomIn")} disabled={!hasImage}>
          +
        </button>
        <button type="button" onClick={onFit} disabled={!hasImage}>
          {t("viewer.fit")}
        </button>
      </div>

      <span className="status-separator" />
      <span className="status-renderer">
        {t("status.renderer")}
        {result ? ` · ${result.elapsedMs} ms` : ""}
      </span>
    </footer>
  );
}
