import { useI18n } from "../i18n";

interface DocumentTabsProps {
  fileName: string | null;
  zoom: number;
  busy: boolean;
  busyLabel: string;
  hasResult: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function DocumentTabs({
  fileName,
  zoom,
  busy,
  busyLabel,
  hasResult,
  onOpen,
  onClose,
}: DocumentTabsProps) {
  const { t } = useI18n();

  return (
    <div className="document-tabs">
      <div className={`document-tab${fileName ? " is-active" : " is-empty"}`}>
        <span className={`document-dot${hasResult ? " is-ready" : ""}${busy ? " is-busy" : ""}`} />
        <span className="document-name">
          {fileName ?? t("document.untitled")}
          {fileName && (
            <span className="document-meta">
              {" "}
              @ {Math.round(zoom * 100)}% ({hasResult ? "SVG" : t("document.preview")})
            </span>
          )}
        </span>
        {fileName && (
          <button
            type="button"
            className="document-close"
            onClick={onClose}
            aria-label={t("action.reset")}
            title={t("action.reset")}
          >
            ×
          </button>
        )}
      </div>
      <button
        type="button"
        className="document-add"
        onClick={onOpen}
        title={t("action.openImage")}
        aria-label={t("action.openImage")}
      >
        +
      </button>
      <div className="document-tabs-spacer" />
      {busy && <span className="document-status">{busyLabel}</span>}
    </div>
  );
}
