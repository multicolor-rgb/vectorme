import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useI18n } from "../i18n";
import {
  cloneDocument,
  deleteAnchor,
  parseSvgDocument,
  refreshPathData,
  serializeSvgDocument,
  smoothAnchor,
  smoothSubpath,
  type Anchor,
  type SvgDocumentModel,
} from "../lib/svgPath";

export interface EditSelectionState {
  hasPath: boolean;
  hasPoint: boolean;
  canUndo: boolean;
  canRedo: boolean;
  pathIndex: number | null;
  subpathIndex: number | null;
  pointIndex: number | null;
}

export interface VectorEditorHandle {
  deleteSelected: () => void;
  smoothSelected: () => void;
  smoothPath: () => void;
  undo: () => void;
  redo: () => void;
  clearSelection: () => void;
}

interface VectorEditorProps {
  svg: string;
  viewWidth: number;
  viewHeight: number;
  pixelScale: number;
  onChange: (svg: string) => void;
  onSelectionChange: (state: EditSelectionState) => void;
  onNotify: (message: string) => void;
}

type DragKind = "anchor" | "in" | "out";

const MAX_HISTORY = 40;

function clampHistory(stack: SvgDocumentModel[]) {
  while (stack.length > MAX_HISTORY) stack.shift();
}

const VectorEditor = forwardRef<VectorEditorHandle, VectorEditorProps>(function VectorEditor(
  { svg, viewWidth, viewHeight, pixelScale, onChange, onSelectionChange, onNotify },
  ref,
) {
  const { t } = useI18n();
  const [initialDocument] = useState(() =>
    parseSvgDocument(svg, viewWidth, viewHeight),
  );
  const documentRef = useRef<SvgDocumentModel>(initialDocument);
  const svgRef = useRef<SVGSVGElement>(null);
  const undoRef = useRef<SvgDocumentModel[]>([]);
  const redoRef = useRef<SvgDocumentModel[]>([]);
  const dragActiveRef = useRef(false);

  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [selectedSubpath, setSelectedSubpath] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [hoverPath, setHoverPath] = useState<number | null>(null);
  const [, setRenderTick] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  const rerender = useCallback(() => setRenderTick((tick) => tick + 1), []);

  const pushHistory = useCallback(() => {
    undoRef.current.push(cloneDocument(documentRef.current));
    clampHistory(undoRef.current);
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPath(null);
    setSelectedSubpath(null);
    setSelectedPoint(null);
  }, []);

  const commitPath = useCallback(
    (pathIndex: number) => {
      const path = documentRef.current.paths[pathIndex];
      if (!path) return;
      refreshPathData(path);
      rerender();
      onChange(serializeSvgDocument(documentRef.current));
    },
    [onChange, rerender],
  );

  const deleteSelected = useCallback(() => {
    if (selectedPath === null || selectedSubpath === null || selectedPoint === null) {
      return;
    }
    const path = documentRef.current.paths[selectedPath];
    const subpath = path?.subpaths[selectedSubpath];
    if (!path || !subpath) return;

    const snapshot = cloneDocument(documentRef.current);
    const result = deleteAnchor(subpath, selectedPoint);

    if (result === "minPoints") {
      onNotify(t("edit.minPoints"));
      return;
    }

    if (result === "empty") {
      path.subpaths.splice(selectedSubpath, 1);
      if (path.subpaths.length === 0) {
        documentRef.current.paths.splice(selectedPath, 1);
        clearSelection();
      } else {
        setSelectedSubpath(null);
        setSelectedPoint(null);
        refreshPathData(path);
      }
    } else {
      setSelectedSubpath(null);
      setSelectedPoint(null);
      refreshPathData(path);
    }

    undoRef.current.push(snapshot);
    clampHistory(undoRef.current);
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
    rerender();
    onChange(serializeSvgDocument(documentRef.current));
  }, [
    clearSelection,
    onChange,
    onNotify,
    rerender,
    selectedPath,
    selectedPoint,
    selectedSubpath,
    t,
  ]);

  const smoothSelected = useCallback(() => {
    if (selectedPath === null || selectedSubpath === null || selectedPoint === null) {
      return;
    }
    const path = documentRef.current.paths[selectedPath];
    const subpath = path?.subpaths[selectedSubpath];
    if (!path || !subpath) return;

    const snapshot = cloneDocument(documentRef.current);
    if (!smoothAnchor(subpath, selectedPoint)) return;

    undoRef.current.push(snapshot);
    clampHistory(undoRef.current);
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
    commitPath(selectedPath);
  }, [commitPath, selectedPath, selectedPoint, selectedSubpath]);

  const smoothPath = useCallback(() => {
    if (selectedPath === null) return;
    const path = documentRef.current.paths[selectedPath];
    if (!path) return;

    const snapshot = cloneDocument(documentRef.current);
    let changed = false;
    for (const subpath of path.subpaths) {
      changed = smoothSubpath(subpath) || changed;
    }
    if (!changed) return;

    undoRef.current.push(snapshot);
    clampHistory(undoRef.current);
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
    commitPath(selectedPath);
  }, [commitPath, selectedPath]);

  const undo = useCallback(() => {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(cloneDocument(documentRef.current));
    clampHistory(redoRef.current);
    documentRef.current = previous;
    clearSelection();
    setHistoryVersion((version) => version + 1);
    rerender();
    onChange(serializeSvgDocument(previous));
  }, [clearSelection, onChange, rerender]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(cloneDocument(documentRef.current));
    clampHistory(undoRef.current);
    documentRef.current = next;
    clearSelection();
    setHistoryVersion((version) => version + 1);
    rerender();
    onChange(serializeSvgDocument(next));
  }, [clearSelection, onChange, rerender]);

  useImperativeHandle(
    ref,
    () => ({
      deleteSelected,
      smoothSelected,
      smoothPath,
      undo,
      redo,
      clearSelection,
    }),
    [clearSelection, deleteSelected, redo, smoothPath, smoothSelected, undo],
  );

  useEffect(() => {
    onSelectionChange({
      hasPath: selectedPath !== null && Boolean(documentRef.current.paths[selectedPath]),
      hasPoint: selectedPoint !== null,
      canUndo: undoRef.current.length > 0,
      canRedo: redoRef.current.length > 0,
      pathIndex: selectedPath,
      subpathIndex: selectedSubpath,
      pointIndex: selectedPoint,
    });
  }, [
    historyVersion,
    onSelectionChange,
    selectedPath,
    selectedPoint,
    selectedSubpath,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (window.document.querySelector(".modal-overlay")) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
      } else if (event.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelection, deleteSelected, redo, undo]);

  const toLocal = useCallback(
    (clientX: number, clientY: number, pathIndex: number) => {
      const svgElement = svgRef.current;
      const path = documentRef.current.paths[pathIndex];
      if (!svgElement || !path) return { x: 0, y: 0 };
      const rect = svgElement.getBoundingClientRect();
      return {
        x:
          ((clientX - rect.left) / Math.max(rect.width, 1)) *
            documentRef.current.viewWidth -
          path.tx,
        y:
          ((clientY - rect.top) / Math.max(rect.height, 1)) *
            documentRef.current.viewHeight -
          path.ty,
      };
    },
    [],
  );

  const beginDrag = useCallback(
    (
      event: React.PointerEvent<SVGElement>,
      kind: DragKind,
      pathIndex: number,
      subpathIndex: number,
      pointIndex: number,
    ) => {
      if (event.button !== 0 || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (dragActiveRef.current) return;

      const path = documentRef.current.paths[pathIndex];
      const anchor = path?.subpaths[subpathIndex]?.anchors[pointIndex];
      if (!path || !anchor) return;

      setSelectedPath(pathIndex);
      setSelectedSubpath(subpathIndex);
      setSelectedPoint(pointIndex);

      const start = toLocal(event.clientX, event.clientY, pathIndex);
      const startClient = { x: event.clientX, y: event.clientY };
      const original: Anchor = { ...anchor };
      let moved = false;
      dragActiveRef.current = true;

      const onMove = (moveEvent: PointerEvent) => {
        const current = toLocal(moveEvent.clientX, moveEvent.clientY, pathIndex);
        if (!moved) {
          const screenDistance = Math.hypot(
            moveEvent.clientX - startClient.x,
            moveEvent.clientY - startClient.y,
          );
          if (screenDistance < 3) return;
          moved = true;
          pushHistory();
        }

        if (kind === "anchor") {
          const dx = current.x - start.x;
          const dy = current.y - start.y;
          anchor.x = original.x + dx;
          anchor.y = original.y + dy;
          anchor.inX = original.inX + dx;
          anchor.inY = original.inY + dy;
          anchor.outX = original.outX + dx;
          anchor.outY = original.outY + dy;
        } else if (kind === "in") {
          anchor.inX = current.x;
          anchor.inY = current.y;
        } else {
          anchor.outX = current.x;
          anchor.outY = current.y;
        }

        refreshPathData(path);
        rerender();
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        dragActiveRef.current = false;
        if (moved) onChange(serializeSvgDocument(documentRef.current));
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onChange, pushHistory, rerender, toLocal],
  );

  const document = documentRef.current;
  const scale = Math.max(pixelScale, 0.0001);
  const nodeHalf = 4.5 / scale;
  const handleRadius = 3.2 / scale;
  const selectedPathModel =
    selectedPath !== null ? document.paths[selectedPath] : undefined;
  const selectedSubpathModel =
    selectedPathModel && selectedSubpath !== null
      ? selectedPathModel.subpaths[selectedSubpath]
      : undefined;
  const selectedAnchor =
    selectedSubpathModel && selectedPoint !== null
      ? selectedSubpathModel.anchors[selectedPoint]
      : undefined;

  return (
    <svg
      ref={svgRef}
      className="vector-editor"
      viewBox={`0 0 ${document.viewWidth} ${document.viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ pointerEvents: "none" }}
    >
      {document.paths.map((path, pathIndex) => (
        <g key={`path-${pathIndex}`} transform={`translate(${path.tx},${path.ty})`}>
          <path
            d={path.d}
            fill={path.fill}
            className="editor-path"
            onPointerDown={(event) => {
              if (event.button !== 0 || event.altKey) return;
              event.stopPropagation();
              setSelectedPath(pathIndex);
              setSelectedSubpath(null);
              setSelectedPoint(null);
            }}
            onPointerEnter={() => setHoverPath(pathIndex)}
            onPointerLeave={() =>
              setHoverPath((current) => (current === pathIndex ? null : current))
            }
          />
        </g>
      ))}

      {hoverPath !== null &&
        hoverPath !== selectedPath &&
        document.paths[hoverPath] && (
          <g
            transform={`translate(${document.paths[hoverPath].tx},${document.paths[hoverPath].ty})`}
          >
            <path
              d={document.paths[hoverPath].d}
              className="editor-outline is-hover"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

      {selectedPathModel && (
        <g transform={`translate(${selectedPathModel.tx},${selectedPathModel.ty})`}>
          <path
            d={selectedPathModel.d}
            className="editor-outline"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )}

      {selectedPathModel && (
        <g transform={`translate(${selectedPathModel.tx},${selectedPathModel.ty})`}>
          {selectedAnchor && selectedPath !== null && selectedSubpath !== null && selectedPoint !== null && (
            <>
              <line
                x1={selectedAnchor.x}
                y1={selectedAnchor.y}
                x2={selectedAnchor.inX}
                y2={selectedAnchor.inY}
                className="vector-handle-line"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={selectedAnchor.x}
                y1={selectedAnchor.y}
                x2={selectedAnchor.outX}
                y2={selectedAnchor.outY}
                className="vector-handle-line"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={selectedAnchor.inX}
                cy={selectedAnchor.inY}
                r={handleRadius}
                className="vector-handle"
                onPointerDown={(event) =>
                  beginDrag(event, "in", selectedPath, selectedSubpath, selectedPoint)
                }
              />
              <circle
                cx={selectedAnchor.outX}
                cy={selectedAnchor.outY}
                r={handleRadius}
                className="vector-handle"
                onPointerDown={(event) =>
                  beginDrag(event, "out", selectedPath, selectedSubpath, selectedPoint)
                }
              />
            </>
          )}

          {selectedPathModel.subpaths.map((subpath, subpathIndex) =>
            subpath.anchors.map((anchor, pointIndex) => (
              <rect
                key={`node-${subpathIndex}-${pointIndex}`}
                x={anchor.x - nodeHalf}
                y={anchor.y - nodeHalf}
                width={nodeHalf * 2}
                height={nodeHalf * 2}
                className={`vector-node${
                  selectedSubpath === subpathIndex && selectedPoint === pointIndex
                    ? " is-selected"
                    : ""
                }`}
                vectorEffect="non-scaling-stroke"
                onPointerDown={(event) => {
                  const pathIndex = selectedPath;
                  if (pathIndex === null) return;
                  beginDrag(event, "anchor", pathIndex, subpathIndex, pointIndex);
                }}
              />
            )),
          )}
        </g>
      )}

      {document.paths.length === 0 && (
        <text
          x={document.viewWidth / 2}
          y={document.viewHeight / 2}
          textAnchor="middle"
          fill="#8a8a8a"
          fontSize={12 / scale}
        >
          {t("edit.noPaths")}
        </text>
      )}
    </svg>
  );
});

export default VectorEditor;
