import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useI18n } from "../i18n";
import type { ViewerMode } from "../types";
import VectorEditor, {
  type EditSelectionState,
  type VectorEditorHandle,
} from "./VectorEditor";

export interface ViewerHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
}

interface ViewerProps {
  sourceUrl: string;
  svgUrl: string | null;
  svgMarkup: string | null;
  svgWidth: number;
  svgHeight: number;
  width: number;
  height: number;
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  split: number;
  onSplitChange: (value: number) => void;
  busy: boolean;
  busyLabel: string;
  onZoomChange: (zoom: number) => void;
  onSvgChange: (svg: string) => void;
  onNotify: (message: string) => void;
  editorKey: number;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 8;

const EMPTY_SELECTION: EditSelectionState = {
  hasPath: false,
  hasPoint: false,
  canUndo: false,
  canRedo: false,
  pathIndex: null,
  subpathIndex: null,
  pointIndex: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const Viewer = forwardRef<ViewerHandle, ViewerProps>(function Viewer(
  {
    sourceUrl,
    svgUrl,
    svgMarkup,
    svgWidth,
    svgHeight,
    width,
    height,
    mode,
    onModeChange,
    split,
    onSplitChange,
    busy,
    busyLabel,
    onZoomChange,
    onSvgChange,
    onNotify,
    editorKey,
  },
  ref,
) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<VectorEditorHandle>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [editState, setEditState] = useState<EditSelectionState>(EMPTY_SELECTION);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setHostSize({ width: rect.width, height: rect.height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => clamp(current * 1.3, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => clamp(current / 1.3, MIN_ZOOM, MAX_ZOOM));
  }, []);

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, fit }), [zoomIn, zoomOut, fit]);

  useEffect(() => {
    fit();
  }, [sourceUrl, width, height, fit]);

  useEffect(() => {
    onZoomChange(zoom);
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      setZoom((current) => clamp(current * factor, MIN_ZOOM, MAX_ZOOM));
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      mode === "edit" &&
      svgMarkup &&
      event.button === 0 &&
      !event.altKey
    ) {
      editorRef.current?.clearSelection();
    }

    const editPan =
      mode === "edit" &&
      (event.button === 1 || (event.button === 0 && event.altKey));
    const normalPan = mode !== "edit" && event.button === 0;
    if (!editPan && !normalPan) return;
    event.preventDefault();
    if (zoom <= 1.01) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    setPanning(true);
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan) return;
    setOffset({
      x: pan.ox + event.clientX - pan.x,
      y: pan.oy + event.clientY - pan.y,
    });
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    panRef.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const startSplit = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const update = (clientX: number) => {
      onSplitChange(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
    };

    update(event.clientX);
    const onMove = (moveEvent: PointerEvent) => update(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const padding = 48;
  const availableWidth = Math.max(0, hostSize.width - padding);
  const availableHeight = Math.max(0, hostSize.height - padding);
  const ratioWidth = svgWidth > 0 ? svgWidth : width;
  const ratioHeight = svgHeight > 0 ? svgHeight : height;
  const ratio = ratioWidth > 0 && ratioHeight > 0 ? ratioWidth / ratioHeight : 1;

  let stageWidth = availableWidth;
  let stageHeight = stageWidth / ratio;

  if (stageHeight > availableHeight) {
    stageHeight = availableHeight;
    stageWidth = stageHeight * ratio;
  }

  const displayMode = !svgUrl && mode !== "source" ? "source" : mode;
  const editorVisible = displayMode === "edit" && Boolean(svgMarkup);
  const showSource = !editorVisible && (displayMode !== "result" || !svgUrl);
  const showResult = !editorVisible && Boolean(svgUrl) && displayMode !== "source";

  return (
    <div className="viewer">
      <div className="viewer-toolbar">
        <div className="segmented segmented--viewer" role="group" aria-label={t("menu.view")}>
          <button
            type="button"
            className={displayMode === "result" ? "is-active" : ""}
            onClick={() => onModeChange("result")}
            disabled={!svgUrl}
          >
            {t("viewer.result")}
          </button>
          <button
            type="button"
            className={displayMode === "source" ? "is-active" : ""}
            onClick={() => onModeChange("source")}
          >
            {t("viewer.original")}
          </button>
          <button
            type="button"
            className={displayMode === "split" ? "is-active" : ""}
            onClick={() => onModeChange("split")}
            disabled={!svgUrl}
          >
            {t("viewer.compare")}
          </button>
          <button
            type="button"
            className={displayMode === "edit" ? "is-active" : ""}
            onClick={() => onModeChange("edit")}
            disabled={!svgMarkup}
          >
            {t("viewer.edit")}
          </button>
        </div>

        <div className="zoom-controls">
          <button type="button" onClick={zoomOut} aria-label={t("viewer.zoomOut")}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={zoomIn} aria-label={t("viewer.zoomIn")}>
            +
          </button>
          <button type="button" className="zoom-fit" onClick={fit}>
            {t("viewer.fit")}
          </button>
        </div>
      </div>

      <div className="viewer-host" ref={hostRef}>
        {stageWidth > 0 && stageHeight > 0 && (
          <div
            ref={stageRef}
            className={`viewer-stage${panning ? " is-panning" : ""}`}
            style={{
              width: stageWidth,
              height: stageHeight,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
              cursor: zoom > 1.01 ? (panning ? "grabbing" : "grab") : "default",
            }}
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            {showSource && (
              <img
                className="viewer-image"
                src={sourceUrl}
                alt={t("viewer.original")}
                draggable={false}
                style={
                  displayMode === "split"
                    ? { clipPath: `inset(0 0 0 ${split}%)` }
                    : undefined
                }
              />
            )}
            {showResult && (
              <img
                className="viewer-image viewer-image--overlay"
                src={svgUrl ?? undefined}
                alt={t("viewer.result")}
                draggable={false}
                style={
                  displayMode === "split"
                    ? { clipPath: `inset(0 ${100 - split}% 0 0)` }
                    : undefined
                }
              />
            )}

            {editorVisible && svgMarkup && (
              <VectorEditor
                key={editorKey}
                ref={editorRef}
                svg={svgMarkup}
                viewWidth={svgWidth}
                viewHeight={svgHeight}
                pixelScale={(stageWidth / Math.max(svgWidth, 1)) * zoom}
                onChange={onSvgChange}
                onSelectionChange={setEditState}
                onNotify={onNotify}
              />
            )}

            {displayMode === "split" && svgUrl && (
              <div
                className="split-handle"
                style={{ left: `${split}%` }}
                onPointerDown={startSplit}
                role="separator"
                aria-label={t("viewer.compare")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(split)}
              >
                <span className="split-grip">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
                  </svg>
                </span>
              </div>
            )}

            {displayMode === "split" && (
              <>
                <span className="split-label split-label--left">{t("viewer.svg")}</span>
                <span className="split-label split-label--right">
                  {t("viewer.originalLabel")}
                </span>
              </>
            )}
          </div>
        )}

        {editorVisible && (
          <div
            className="node-toolbar"
            onPointerDown={(event) => event.stopPropagation()}
            title={t("edit.hint")}
          >
            <span className="node-toolbar-status">
              {editState.hasPoint && editState.pointIndex !== null
                ? t("edit.pointSelected", { index: editState.pointIndex + 1 })
                : editState.hasPath && editState.pathIndex !== null
                  ? t("edit.pathSelected", { index: editState.pathIndex + 1 })
                  : t("edit.hintSelectPath")}
            </span>
            <button
              type="button"
              className="node-action node-action--danger"
              onClick={() => editorRef.current?.deleteSelected()}
              disabled={!editState.hasPoint}
            >
              {t("edit.deletePoint")}
            </button>
            <button
              type="button"
              className="node-action"
              onClick={() => editorRef.current?.smoothSelected()}
              disabled={!editState.hasPoint}
            >
              {t("edit.smoothPoint")}
            </button>
            <button
              type="button"
              className="node-action"
              onClick={() => editorRef.current?.smoothPath()}
              disabled={!editState.hasPath}
            >
              {t("edit.smoothPath")}
            </button>
            <span className="node-toolbar-separator" />
            <button
              type="button"
              className="node-action"
              onClick={() => editorRef.current?.undo()}
              disabled={!editState.canUndo}
            >
              {t("edit.undo")}
            </button>
            <button
              type="button"
              className="node-action"
              onClick={() => editorRef.current?.redo()}
              disabled={!editState.canRedo}
            >
              {t("edit.redo")}
            </button>
            <span className="node-toolbar-separator" />
            <button
              type="button"
              className="node-action node-action--done"
              onClick={() => onModeChange("result")}
            >
              {t("edit.done")}
            </button>
          </div>
        )}

        {busy && (
          <div className="viewer-busy">
            <span className="spinner" />
            <span>{busyLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default Viewer;
