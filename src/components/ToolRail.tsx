import { useI18n } from "../i18n";
import type { ViewerMode } from "../types";

interface ToolRailProps {
  hasImage: boolean;
  hasResult: boolean;
  busy: boolean;
  mode: ViewerMode;
  onOpen: () => void;
  onTrace: () => void;
  onMode: (mode: ViewerMode) => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSettings: () => void;
}

type IconName =
  | "open"
  | "trace"
  | "result"
  | "original"
  | "compare"
  | "edit"
  | "fit"
  | "zoomIn"
  | "zoomOut"
  | "settings";

export default function ToolRail({
  hasImage,
  hasResult,
  busy,
  mode,
  onOpen,
  onTrace,
  onMode,
  onFit,
  onZoomIn,
  onZoomOut,
  onSettings,
}: ToolRailProps) {
  const { t } = useI18n();

  const button = (
    id: string,
    icon: IconName,
    label: string,
    action: () => void,
    options?: { active?: boolean; disabled?: boolean },
  ) => (
    <button
      key={id}
      type="button"
      className={`rail-button${options?.active ? " is-active" : ""}`}
      onClick={action}
      disabled={options?.disabled}
      title={label}
      aria-label={label}
    >
      <RailIcon name={icon} />
    </button>
  );

  return (
    <aside className="tool-rail" aria-label={t("rail.tools")}>
      <div className="tool-rail-group">
        {button("open", "open", t("rail.open"), onOpen)}
        {button("trace", "trace", t("rail.trace"), onTrace, {
          disabled: !hasImage || busy,
        })}
      </div>

      <div className="tool-rail-separator" />

      <div className="tool-rail-group">
        {button("result", "result", t("rail.result"), () => onMode("result"), {
          active: hasResult && mode === "result",
          disabled: !hasResult,
        })}
        {button("original", "original", t("rail.original"), () => onMode("source"), {
          active: hasImage && mode === "source",
          disabled: !hasImage,
        })}
        {button("compare", "compare", t("rail.compare"), () => onMode("split"), {
          active: hasResult && mode === "split",
          disabled: !hasResult,
        })}
        {button("edit", "edit", t("rail.edit"), () => onMode("edit"), {
          active: hasResult && mode === "edit",
          disabled: !hasResult,
        })}
      </div>

      <div className="tool-rail-separator" />

      <div className="tool-rail-group">
        {button("fit", "fit", t("rail.fit"), onFit, { disabled: !hasImage })}
        {button("zoom-in", "zoomIn", t("rail.zoomIn"), onZoomIn, { disabled: !hasImage })}
        {button("zoom-out", "zoomOut", t("rail.zoomOut"), onZoomOut, { disabled: !hasImage })}
      </div>

      <div className="tool-rail-spacer" />

      {button("settings", "settings", t("rail.settings"), onSettings)}
    </aside>
  );
}

function RailIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "open":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M3.5 7.5h6l2-2h9v13h-17z" />
          <path d="M3.5 9.5h17l-2.2 9h-17z" />
        </svg>
      );
    case "trace":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m5 19 5.5-5.5" />
          <path d="M14 4.5 19.5 10 12 17.5 6.5 12 14 4.5Z" />
          <path d="m17 2 .6 2.4L20 5l-2.4.6L17 8l-.6-2.4L14 5l2.4-.6L17 2Z" />
        </svg>
      );
    case "result":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
          <path d="m6.5 16.5 4-5 3 3.5 2.2-2.5 2.8 4" />
          <circle cx="9" cy="9" r="1.3" />
        </svg>
      );
    case "original":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
          <path d="m6.5 16.5 4-5 3 3.5 2.2-2.5 2.8 4" />
          <circle cx="9" cy="9" r="1.3" />
          <path d="M18 3v3M16.5 4.5h3" />
        </svg>
      );
    case "compare":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
          <path d="M12 3v18" strokeDasharray="2 2" />
          <path d="m6 15 3.5-4 2 2.4" />
          <path d="m14 15 2.2-3 2.3 3" />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 20c2.2-1.1 3.7-2.7 4.8-4.8L18.5 5.5a2.1 2.1 0 0 1 3 3L11.8 18.2C9.7 19.3 8.1 20 4 20Z" />
          <path d="m16.5 7.5 3 3" />
          <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "fit":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
          <rect x="8" y="8" width="8" height="8" rx="0.8" />
        </svg>
      );
    case "zoomIn":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="m15 15 4.5 4.5M10.5 7.5v6M7.5 10.5h6" />
        </svg>
      );
    case "zoomOut":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="m15 15 4.5 4.5M7.5 10.5h6" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.6-1.2-1.8-3.1-1.9.8a7.6 7.6 0 0 0-2.6-1.5L14.4 3h-3.6l-.3 2.5a7.6 7.6 0 0 0-2.6 1.5l-1.9-.8-1.8 3.1 1.6 1.2a7.7 7.7 0 0 0 0 3l-1.6 1.2 1.8 3.1 1.9-.8a7.6 7.6 0 0 0 2.6 1.5l.3 2.5h3.6l.3-2.5a7.6 7.6 0 0 0 2.6-1.5l1.9.8 1.8-3.1-1.6-1.2Z" />
        </svg>
      );
  }
}
