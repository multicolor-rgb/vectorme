export interface Anchor {
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

export interface Subpath {
  anchors: Anchor[];
  closed: boolean;
}

export interface SvgPathModel {
  d: string;
  fill: string;
  tx: number;
  ty: number;
  subpaths: Subpath[];
}

export interface SvgDocumentModel {
  viewWidth: number;
  viewHeight: number;
  outputWidth: number;
  outputHeight: number;
  paths: SvgPathModel[];
}

export type DeleteResult = "ok" | "minPoints" | "empty";

const NUMBER_RE = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

function makeAnchor(x: number, y: number): Anchor {
  return { x, y, inX: x, inY: y, outX: x, outY: y };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function parseLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseTranslate(transform: string | null): { tx: number; ty: number } {
  if (!transform) return { tx: 0, ty: 0 };
  const match = transform.match(
    /translate\(\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)(?:[,\s]+([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?))?\s*\)/,
  );
  if (!match) return { tx: 0, ty: 0 };
  return {
    tx: Number.parseFloat(match[1]) || 0,
    ty: match[2] ? Number.parseFloat(match[2]) || 0 : 0,
  };
}

/**
 * Parser for the SVG path subset produced by VTracer (M/C/Z) plus the common
 * line, quadratic and smooth variants. Every segment is normalized to a cubic
 * so the node editor only has to deal with one representation.
 */
export function parsePathData(data: string): Subpath[] {
  const subpaths: Subpath[] = [];
  let currentSubpath: Subpath | null = null;
  let point = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };
  let previousCubic: { x: number; y: number } | null = null;
  let previousQuad: { x: number; y: number } | null = null;

  const pushSubpath = () => {
    if (currentSubpath && currentSubpath.anchors.length >= 2) {
      subpaths.push(currentSubpath);
    }
    currentSubpath = null;
  };

  const ensureSubpath = (): Subpath => {
    if (!currentSubpath) {
      currentSubpath = {
        anchors: [makeAnchor(point.x, point.y)],
        closed: false,
      };
    }
    return currentSubpath;
  };

  const lineTo = (x: number, y: number) => {
    const subpath = ensureSubpath();
    const previous = subpath.anchors[subpath.anchors.length - 1];
    previous.outX = previous.x;
    previous.outY = previous.y;
    subpath.anchors.push(makeAnchor(x, y));
    point = { x, y };
  };

  const curveTo = (
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    x: number,
    y: number,
  ) => {
    const subpath = ensureSubpath();
    const previous = subpath.anchors[subpath.anchors.length - 1];
    previous.outX = c1x;
    previous.outY = c1y;
    subpath.anchors.push({ x, y, inX: c2x, inY: c2y, outX: x, outY: y });
    point = { x, y };
  };

  const quadTo = (qx: number, qy: number, x: number, y: number) => {
    curveTo(
      point.x + (2 / 3) * (qx - point.x),
      point.y + (2 / 3) * (qy - point.y),
      x + (2 / 3) * (qx - x),
      y + (2 / 3) * (qy - y),
      x,
      y,
    );
    previousQuad = { x: qx, y: qy };
    previousCubic = null;
  };

  const closeSubpath = () => {
    if (!currentSubpath) return;
    const subpath = currentSubpath;
    if (subpath.anchors.length >= 2) {
      const first = subpath.anchors[0];
      const last = subpath.anchors[subpath.anchors.length - 1];
      if (distance(first, last) < 0.01) {
        first.inX = last.inX;
        first.inY = last.inY;
        subpath.anchors.pop();
      } else {
        last.outX = last.x;
        last.outY = last.y;
        first.inX = first.x;
        first.inY = first.y;
      }
      subpath.closed = true;
      if (subpath.anchors.length >= 2) subpaths.push(subpath);
    }
    currentSubpath = null;
    point = { ...start };
  };

  const commandRe = /([a-zA-Z])([^a-zA-Z]*)/g;
  let chunk: RegExpExecArray | null;

  while ((chunk = commandRe.exec(data)) !== null) {
    const command = chunk[1];
    const upper = command.toUpperCase();
    const relative = command !== upper;
    const values = (chunk[2].match(NUMBER_RE) ?? []).map(Number);

    if (upper === "Z") {
      closeSubpath();
      previousCubic = null;
      previousQuad = null;
      continue;
    }

    if (values.length === 0) continue;

    if (upper === "M") {
      let index = 0;
      let x = values[index] + (relative ? point.x : 0);
      let y = values[index + 1] + (relative ? point.y : 0);
      pushSubpath();
      start = { x, y };
      point = { x, y };
      currentSubpath = { anchors: [makeAnchor(x, y)], closed: false };
      index += 2;

      // Additional pairs after moveto are implicit lineto commands.
      while (index + 1 < values.length) {
        x = values[index] + (relative ? point.x : 0);
        y = values[index + 1] + (relative ? point.y : 0);
        lineTo(x, y);
        index += 2;
      }
      previousCubic = null;
      previousQuad = null;
      continue;
    }

    let index = 0;
    switch (upper) {
      case "L": {
        while (index + 1 < values.length) {
          const x = values[index] + (relative ? point.x : 0);
          const y = values[index + 1] + (relative ? point.y : 0);
          lineTo(x, y);
          index += 2;
        }
        previousCubic = null;
        previousQuad = null;
        break;
      }
      case "H": {
        while (index < values.length) {
          const x = values[index] + (relative ? point.x : 0);
          lineTo(x, point.y);
          index += 1;
        }
        previousCubic = null;
        previousQuad = null;
        break;
      }
      case "V": {
        while (index < values.length) {
          const y = values[index] + (relative ? point.y : 0);
          lineTo(point.x, y);
          index += 1;
        }
        previousCubic = null;
        previousQuad = null;
        break;
      }
      case "C": {
        while (index + 5 < values.length) {
          const c1x = values[index] + (relative ? point.x : 0);
          const c1y = values[index + 1] + (relative ? point.y : 0);
          const c2x = values[index + 2] + (relative ? point.x : 0);
          const c2y = values[index + 3] + (relative ? point.y : 0);
          const x = values[index + 4] + (relative ? point.x : 0);
          const y = values[index + 5] + (relative ? point.y : 0);
          curveTo(c1x, c1y, c2x, c2y, x, y);
          previousCubic = { x: c2x, y: c2y };
          previousQuad = null;
          index += 6;
        }
        break;
      }
      case "S": {
        while (index + 3 < values.length) {
          const c1x = previousCubic ? 2 * point.x - previousCubic.x : point.x;
          const c1y = previousCubic ? 2 * point.y - previousCubic.y : point.y;
          const c2x = values[index] + (relative ? point.x : 0);
          const c2y = values[index + 1] + (relative ? point.y : 0);
          const x = values[index + 2] + (relative ? point.x : 0);
          const y = values[index + 3] + (relative ? point.y : 0);
          curveTo(c1x, c1y, c2x, c2y, x, y);
          previousCubic = { x: c2x, y: c2y };
          previousQuad = null;
          index += 4;
        }
        break;
      }
      case "Q": {
        while (index + 3 < values.length) {
          const qx = values[index] + (relative ? point.x : 0);
          const qy = values[index + 1] + (relative ? point.y : 0);
          const x = values[index + 2] + (relative ? point.x : 0);
          const y = values[index + 3] + (relative ? point.y : 0);
          quadTo(qx, qy, x, y);
          index += 4;
        }
        break;
      }
      case "T": {
        while (index + 1 < values.length) {
          const previous = previousQuad as { x: number; y: number } | null;
          const qx = previous ? 2 * point.x - previous.x : point.x;
          const qy = previous ? 2 * point.y - previous.y : point.y;
          const x = values[index] + (relative ? point.x : 0);
          const y = values[index + 1] + (relative ? point.y : 0);
          quadTo(qx, qy, x, y);
          index += 2;
        }
        break;
      }
      default:
        // Unsupported command: stop processing the path.
        index = values.length;
        break;
    }
  }

  pushSubpath();
  return subpaths;
}

export function parseSvgDocument(
  svg: string,
  fallbackWidth: number,
  fallbackHeight: number,
): SvgDocumentModel {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = document.documentElement;
  const viewBox = (root.getAttribute("viewBox") ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  const viewWidth =
    viewBox.length === 4 && Number.isFinite(viewBox[2]) && viewBox[2] > 0
      ? viewBox[2]
      : fallbackWidth;
  const viewHeight =
    viewBox.length === 4 && Number.isFinite(viewBox[3]) && viewBox[3] > 0
      ? viewBox[3]
      : fallbackHeight;
  const outputWidth = parseLength(root.getAttribute("width")) ?? viewWidth;
  const outputHeight = parseLength(root.getAttribute("height")) ?? viewHeight;

  const paths: SvgPathModel[] = [];
  for (const node of Array.from(root.querySelectorAll("path"))) {
    const d = node.getAttribute("d");
    if (!d) continue;
    const subpaths = parsePathData(d);
    if (subpaths.length === 0) continue;
    const { tx, ty } = parseTranslate(node.getAttribute("transform"));
    paths.push({
      d,
      fill: node.getAttribute("fill") ?? "#000000",
      tx,
      ty,
      subpaths,
    });
  }

  return { viewWidth, viewHeight, outputWidth, outputHeight, paths };
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function serializePathData(subpaths: Subpath[]): string {
  const parts: string[] = [];

  for (const subpath of subpaths) {
    if (subpath.anchors.length < 2) continue;
    const anchors = subpath.anchors;
    parts.push(`M${formatNumber(anchors[0].x)} ${formatNumber(anchors[0].y)}`);

    for (let index = 0; index < anchors.length - 1; index += 1) {
      const current = anchors[index];
      const next = anchors[index + 1];
      parts.push(
        `C${formatNumber(current.outX)} ${formatNumber(current.outY)} ${formatNumber(next.inX)} ${formatNumber(next.inY)} ${formatNumber(next.x)} ${formatNumber(next.y)}`,
      );
    }

    if (subpath.closed) {
      const last = anchors[anchors.length - 1];
      const first = anchors[0];
      parts.push(
        `C${formatNumber(last.outX)} ${formatNumber(last.outY)} ${formatNumber(first.inX)} ${formatNumber(first.inY)} ${formatNumber(first.x)} ${formatNumber(first.y)}`,
      );
      parts.push("Z");
    }
  }

  return parts.join(" ");
}

export function serializeSvgDocument(document: SvgDocumentModel): string {
  const paths = document.paths
    .filter((path) => path.subpaths.length > 0)
    .map((path) => {
      const transform =
        path.tx !== 0 || path.ty !== 0
          ? ` transform="translate(${formatNumber(path.tx)},${formatNumber(path.ty)})"`
          : "";
      return `<path d="${path.d}" fill="${path.fill}"${transform}/>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!-- Generator: visioncortex VTracer 0.6.5; edited in Vectorme -->",
    `<svg aria-label="Vectorme vector trace" xmlns="http://www.w3.org/2000/svg" width="${formatNumber(document.outputWidth)}" height="${formatNumber(document.outputHeight)}" viewBox="0 0 ${formatNumber(document.viewWidth)} ${formatNumber(document.viewHeight)}">`,
    paths,
    "</svg>",
    "",
  ].join("\n");
}

export function cloneDocument(document: SvgDocumentModel): SvgDocumentModel {
  return JSON.parse(JSON.stringify(document)) as SvgDocumentModel;
}

export function refreshPathData(path: SvgPathModel): void {
  path.d = serializePathData(path.subpaths);
}

export function smoothAnchor(subpath: Subpath, index: number): boolean {
  const count = subpath.anchors.length;
  if (count < 2 || index < 0 || index >= count) return false;
  const anchor = subpath.anchors[index];
  const previous = subpath.closed
    ? subpath.anchors[(index - 1 + count) % count]
    : index > 0
      ? subpath.anchors[index - 1]
      : null;
  const next = subpath.closed
    ? subpath.anchors[(index + 1) % count]
    : index < count - 1
      ? subpath.anchors[index + 1]
      : null;

  if (previous && next) {
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const inLength = distance(previous, anchor) / 3;
    const outLength = distance(anchor, next) / 3;
    anchor.inX = anchor.x - ux * inLength;
    anchor.inY = anchor.y - uy * inLength;
    anchor.outX = anchor.x + ux * outLength;
    anchor.outY = anchor.y + uy * outLength;
    return true;
  }

  if (next) {
    const dx = next.x - anchor.x;
    const dy = next.y - anchor.y;
    anchor.inX = anchor.x;
    anchor.inY = anchor.y;
    anchor.outX = anchor.x + dx / 3;
    anchor.outY = anchor.y + dy / 3;
    return true;
  }

  if (previous) {
    const dx = anchor.x - previous.x;
    const dy = anchor.y - previous.y;
    anchor.outX = anchor.x;
    anchor.outY = anchor.y;
    anchor.inX = anchor.x - dx / 3;
    anchor.inY = anchor.y - dy / 3;
    return true;
  }

  return false;
}

export function smoothSubpath(subpath: Subpath): boolean {
  let changed = false;
  for (let index = 0; index < subpath.anchors.length; index += 1) {
    changed = smoothAnchor(subpath, index) || changed;
  }
  return changed;
}

export function deleteAnchor(subpath: Subpath, index: number): DeleteResult {
  const count = subpath.anchors.length;
  if (subpath.closed && count <= 3) return "minPoints";
  if (!subpath.closed && count <= 2) return "minPoints";
  if (index < 0 || index >= count) return "minPoints";

  const previousIndex = subpath.closed ? (index - 1 + count) % count : index - 1;
  const nextIndex = subpath.closed ? (index + 1) % count : index + 1;

  if (previousIndex < 0 || nextIndex >= count) {
    subpath.anchors.splice(index, 1);
    if (subpath.anchors.length === 0) return "empty";
    if (index === 0) {
      const first = subpath.anchors[0];
      first.inX = first.x;
      first.inY = first.y;
    } else {
      const last = subpath.anchors[subpath.anchors.length - 1];
      last.outX = last.x;
      last.outY = last.y;
    }
    return "ok";
  }

  const previous = subpath.anchors[previousIndex];
  const next = subpath.anchors[nextIndex];
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;
  previous.outX = previous.x + dx / 3;
  previous.outY = previous.y + dy / 3;
  next.inX = next.x - dx / 3;
  next.inY = next.y - dy / 3;
  subpath.anchors.splice(index, 1);
  return "ok";
}
