import { useCallback, useEffect, useRef, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import DocumentTabs from "./components/DocumentTabs";
import InfoDialog from "./components/InfoDialog";
import MenuBar from "./components/MenuBar";
import RightPanel from "./components/RightPanel";
import SettingsDialog from "./components/SettingsDialog";
import ToolRail from "./components/ToolRail";
import Viewer, { type ViewerHandle } from "./components/Viewer";
import { ContextBar, StatusBar } from "./components/StatusBar";
import { useI18n, localizeError } from "./i18n";
import {
  errorMessage,
  isImagePath,
  isTauriRuntime,
  loadImagePreview,
  pickImagePath,
  pickSavePath,
  saveSvg,
  svgNameFor,
  traceImage,
} from "./lib/api";
import { PRESETS } from "./lib/presets";
import type {
  BusyState,
  ImagePreview,
  PresetId,
  TraceOptions,
  TraceResult,
  TraceWarning,
  ViewerMode,
} from "./types";

interface Notice {
  kind: "ok" | "error";
  text: string;
}

export default function App() {
  const { t } = useI18n();
  const [options, setOptions] = useState<TraceOptions>(() => ({ ...PRESETS.logo.options }));
  const optionsRef = useRef(options);
  const requestRef = useRef(0);
  const viewerRef = useRef<ViewerHandle>(null);

  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [source, setSource] = useState<ImagePreview | null>(null);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [editedSvg, setEditedSvg] = useState<string | null>(null);
  const [traceRevision, setTraceRevision] = useState(0);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<TraceWarning[]>([]);
  const [busy, setBusy] = useState<BusyState>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("result");
  const [split, setSplit] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoDialog, setInfoDialog] = useState<"shortcuts" | "about" | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!editedSvg) {
      setSvgUrl(null);
      return;
    }

    const blob = new Blob([editedSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setSvgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editedSvg]);

  useEffect(() => {
    if (!notice || notice.kind !== "ok") return;
    const timer = window.setTimeout(() => setNotice(null), 5500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const performTrace = useCallback(
    async (path: string, nextOptions: TraceOptions) => {
      const requestId = ++requestRef.current;
      setBusy("trace");
      setNotice((current) => (current?.kind === "error" ? null : current));

      try {
        const traced = await traceImage(path, nextOptions);
        if (requestId !== requestRef.current) return;
        setResult(traced);
        setWarnings(traced.warnings);
        setEditedSvg(traced.svg);
        setTraceRevision((revision) => revision + 1);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setNotice({ kind: "error", text: localizeError(errorMessage(error), t) });
      } finally {
        if (requestId === requestRef.current) setBusy(null);
      }
    },
    [t],
  );

  const openPath = useCallback(
    async (path: string) => {
      if (!isTauriRuntime()) {
        setNotice({ kind: "error", text: t("toast.engineUnavailable") });
        return;
      }

      const requestId = ++requestRef.current;
      setBusy("load");
      setNotice(null);

      try {
        const preview = await loadImagePreview(path, 1600);
        if (requestId !== requestRef.current) return;

        setSourcePath(path);
        setSource(preview);
        setResult(null);
        setEditedSvg(null);
        setWarnings([]);
        setViewerMode("result");
        setSplit(50);
        setBusy(null);
        await performTrace(path, optionsRef.current);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setBusy(null);
        setNotice({ kind: "error", text: localizeError(errorMessage(error), t) });
      }
    },
    [performTrace, t],
  );

  const handlePick = useCallback(async () => {
    if (!isTauriRuntime()) {
      setNotice({ kind: "error", text: t("toast.desktopOnly") });
      return;
    }

    try {
      const path = await pickImagePath(t("dialog.openTitle"), t("dialog.imageFilter"));
      if (path) await openPath(path);
    } catch (error) {
      setNotice({ kind: "error", text: localizeError(errorMessage(error), t) });
    }
  }, [openPath, t]);

  const handlePreset = useCallback(
    (id: Exclude<PresetId, "custom">) => {
      const next = { ...PRESETS[id].options };
      setOptions(next);
      if (sourcePath) void performTrace(sourcePath, next);
    },
    [performTrace, sourcePath],
  );

  const handleChange = useCallback((patch: Partial<TraceOptions>) => {
    setOptions((current) => ({ ...current, ...patch, preset: "custom" }));
  }, []);

  const handleTrace = useCallback(() => {
    if (!sourcePath) {
      setNotice({ kind: "error", text: t("toast.noImage") });
      return;
    }
    void performTrace(sourcePath, optionsRef.current);
  }, [performTrace, sourcePath, t]);

  const handleSave = useCallback(async () => {
    if (!editedSvg || !sourcePath) return;

    if (!isTauriRuntime()) {
      setNotice({ kind: "error", text: t("toast.saveDesktopOnly") });
      return;
    }

    try {
      const target = await pickSavePath(
        svgNameFor(sourcePath),
        t("dialog.saveTitle"),
        t("dialog.svgFilter"),
      );
      if (!target) return;
      const finalPath = target.toLowerCase().endsWith(".svg") ? target : `${target}.svg`;
      await saveSvg(finalPath, editedSvg);
      setNotice({ kind: "ok", text: t("toast.saved", { path: finalPath }) });
    } catch (error) {
      setNotice({ kind: "error", text: localizeError(errorMessage(error), t) });
    }
  }, [editedSvg, sourcePath, t]);

  const handleReset = useCallback(() => {
    requestRef.current += 1;
    setSourcePath(null);
    setSource(null);
    setResult(null);
    setEditedSvg(null);
    setSvgUrl(null);
    setWarnings([]);
    setBusy(null);
    setViewerMode("result");
    setSplit(50);
    setZoom(1);
    setNotice(null);
  }, []);

  const handleQuit = useCallback(() => {
    if (isTauriRuntime()) {
      void getCurrentWindow().close();
    } else {
      window.close();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (settingsOpen || infoDialog) {
        return;
      }

      if (event.key === "F1") {
        event.preventDefault();
        setInfoDialog("shortcuts");
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (key === "o") {
        event.preventDefault();
        void handlePick();
      } else if (key === "s") {
        event.preventDefault();
        void handleSave();
      } else if (key === "enter") {
        event.preventDefault();
        handleTrace();
      } else if (key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (key === "=" || key === "+") {
        event.preventDefault();
        viewerRef.current?.zoomIn();
      } else if (key === "-" || key === "_") {
        event.preventDefault();
        viewerRef.current?.zoomOut();
      } else if (key === "0") {
        event.preventDefault();
        viewerRef.current?.fit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePick, handleSave, handleTrace, settingsOpen, infoDialog]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setDragging(true);
          return;
        }

        setDragging(false);

        if (event.payload.type === "drop") {
          const path = event.payload.paths.find(isImagePath);
          if (path) {
            void openPath(path);
          } else if (event.payload.paths.length > 0) {
            setNotice({ kind: "error", text: t("toast.unsupported") });
          }
        }
      })
      .then((dispose) => {
        if (cancelled) dispose();
        else unlisten = dispose;
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [openPath, t]);

  const busyLabel = busy === "load" ? t("viewer.loading") : t("viewer.tracing");
  const fileName = sourcePath ? (sourcePath.split(/[\\/]/).pop() ?? null) : null;
  const hasResult = Boolean(result);

  return (
    <div className="app">
      <MenuBar
        mode={viewerMode}
        hasImage={Boolean(source)}
        hasResult={hasResult}
        busy={busy !== null}
        onOpen={() => void handlePick()}
        onSave={() => void handleSave()}
        onTrace={handleTrace}
        onReset={handleReset}
        onQuit={handleQuit}
        onSettings={() => setSettingsOpen(true)}
        onMode={setViewerMode}
        onFit={() => viewerRef.current?.fit()}
        onZoomIn={() => viewerRef.current?.zoomIn()}
        onZoomOut={() => viewerRef.current?.zoomOut()}
        onShortcuts={() => setInfoDialog("shortcuts")}
        onAbout={() => setInfoDialog("about")}
      />

      <DocumentTabs
        fileName={fileName}
        zoom={zoom}
        busy={busy !== null}
        busyLabel={busyLabel}
        hasResult={hasResult}
        onOpen={() => void handlePick()}
        onClose={handleReset}
      />

      {busy && <div className="progress-line" />}

      <div className="workspace">
        <ToolRail
          hasImage={Boolean(source)}
          hasResult={hasResult}
          busy={busy !== null}
          mode={viewerMode}
          onOpen={() => void handlePick()}
          onTrace={handleTrace}
          onMode={setViewerMode}
          onFit={() => viewerRef.current?.fit()}
          onZoomIn={() => viewerRef.current?.zoomIn()}
          onZoomOut={() => viewerRef.current?.zoomOut()}
          onSettings={() => setSettingsOpen(true)}
        />

        <main className={`canvas-area${dragging ? " is-dragging" : ""}`}>
          {source ? (
            <Viewer
              ref={viewerRef}
              sourceUrl={source.dataUrl}
              svgUrl={svgUrl}
              svgMarkup={editedSvg}
              svgWidth={result?.width ?? source.width}
              svgHeight={result?.height ?? source.height}
              width={source.width}
              height={source.height}
              mode={viewerMode}
              onModeChange={setViewerMode}
              split={split}
              onSplitChange={setSplit}
              busy={busy !== null}
              busyLabel={busyLabel}
              onZoomChange={setZoom}
              onSvgChange={setEditedSvg}
              onNotify={(message) => setNotice({ kind: "error", text: message })}
              editorKey={traceRevision}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-art" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <rect x="12" y="18" width="96" height="84" rx="8" />
                  <circle cx="42" cy="46" r="8" />
                  <path d="m24 86 24-28 16 18 10-12 22 22" />
                  <path className="empty-art-arrow" d="M92 12v18M84 22l8 8 8-8" />
                </svg>
              </div>
              <h1>{t("empty.title")}</h1>
              <p>{t("empty.body")}</p>
              <button
                type="button"
                className="btn btn--primary btn--large"
                onClick={() => void handlePick()}
              >
                {t("empty.open")}
              </button>
              <div className="format-chips">
                {["PNG", "JPEG", "WebP", "BMP", "GIF", "TIFF"].map((format) => (
                  <span key={format}>{format}</span>
                ))}
              </div>
              <small className="empty-note">{t("empty.note")}</small>
            </div>
          )}

          {dragging && (
            <div className="drop-overlay">
              <div>
                <strong>{t("empty.drop")}</strong>
                <span>{t("empty.dropBody")}</span>
              </div>
            </div>
          )}
        </main>

        <RightPanel
          options={options}
          onChange={handleChange}
          onPreset={handlePreset}
          onTrace={handleTrace}
          onSave={() => void handleSave()}
          canTrace={Boolean(sourcePath)}
          canSave={Boolean(editedSvg) && Boolean(sourcePath)}
          busy={busy !== null}
          result={result}
          warnings={warnings}
          edited={Boolean(result && editedSvg && editedSvg !== result.svg)}
        />
      </div>

      <ContextBar
        busy={busy}
        hasImage={Boolean(source)}
        hasResult={hasResult}
        editing={viewerMode === "edit"}
      />
      <StatusBar
        busy={busy}
        hasImage={Boolean(source)}
        sourceWidth={source?.sourceWidth ?? null}
        sourceHeight={source?.sourceHeight ?? null}
        result={result}
        zoom={zoom}
        editing={viewerMode === "edit"}
        onZoomIn={() => viewerRef.current?.zoomIn()}
        onZoomOut={() => viewerRef.current?.zoomOut()}
        onFit={() => viewerRef.current?.fit()}
      />

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {infoDialog && (
        <InfoDialog kind={infoDialog} onClose={() => setInfoDialog(null)} />
      )}

      {notice && (
        <div className={`toast toast--${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={t("action.close")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
