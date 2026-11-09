import type { ReactNode } from "react";
import { useState } from "react";
import { useI18n, warningMessage } from "../i18n";
import { PRESET_LIST } from "../lib/presets";
import type { PresetId, TraceOptions, TraceResult, TraceWarning } from "../types";

interface RightPanelProps {
  options: TraceOptions;
  onChange: (patch: Partial<TraceOptions>) => void;
  onPreset: (id: Exclude<PresetId, "custom">) => void;
  onTrace: () => void;
  onSave: () => void;
  canTrace: boolean;
  canSave: boolean;
  busy: boolean;
  result: TraceResult | null;
  warnings: TraceWarning[];
  edited: boolean;
}

type PanelTab = "properties" | "presets" | "output";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="slider">
      <span className="slider-head">
        <span>{label}</span>
        <span className="value-box">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
      />
      {hint && <span className="slider-hint">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="prop-section">
      <h3>{title}</h3>
      <div className="prop-section-body">{children}</div>
    </section>
  );
}

function PresetIcon({ id }: { id: Exclude<PresetId, "custom"> }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (id === "logo") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
        <circle cx="16" cy="16" r="10.5" />
        <path d="M10 12h12l-6 11z" fill="currentColor" stroke="none" opacity="0.9" />
      </svg>
    );
  }

  if (id === "bw") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
        <circle cx="16" cy="16" r="10.5" />
        <path d="M16 5.5a10.5 10.5 0 0 1 0 21z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
      <rect x="5" y="7" width="22" height="18" rx="2.5" />
      <circle cx="12" cy="13" r="2.2" fill="currentColor" stroke="none" />
      <path d="m7 23 6-7 4 4 3-3 5 6" />
    </svg>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

export default function RightPanel({
  options,
  onChange,
  onPreset,
  onTrace,
  onSave,
  canTrace,
  canSave,
  busy,
  result,
  warnings,
  edited,
}: RightPanelProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<PanelTab>("properties");

  return (
    <aside className="right-panel">
      <div className="panel-tabs" role="tablist" aria-label={t("panel.properties")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "properties"}
          className={tab === "properties" ? "is-active" : ""}
          onClick={() => setTab("properties")}
        >
          {t("panel.properties")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "presets"}
          className={tab === "presets" ? "is-active" : ""}
          onClick={() => setTab("presets")}
        >
          {t("panel.presets")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "output"}
          className={tab === "output" ? "is-active" : ""}
          onClick={() => setTab("output")}
        >
          {t("panel.output")}
          {result && <span className="tab-dot" />}
        </button>
      </div>

      <div className="panel-body">
        {tab === "properties" && (
          <div className="properties">
            <Section title={t("group.color")}>
              <span className="field-label">{t("control.colorMode")}</span>
              <Segmented
                value={options.colorMode}
                ariaLabel={t("control.colorMode")}
                disabled={busy}
                onChange={(colorMode) => onChange({ colorMode })}
                options={[
                  { value: "color", label: t("control.color") },
                  { value: "binary", label: t("control.binary") },
                ]}
              />
              <Slider
                label={t("control.colorPrecision")}
                hint={t("control.colorPrecisionHint")}
                value={options.colorPrecision}
                min={1}
                max={8}
                onChange={(colorPrecision) => onChange({ colorPrecision })}
                disabled={busy || options.colorMode === "binary"}
              />
              <Slider
                label={t("control.layerDifference")}
                hint={t("control.layerDifferenceHint")}
                value={options.layerDifference}
                min={0}
                max={128}
                onChange={(layerDifference) => onChange({ layerDifference })}
                disabled={busy || options.colorMode === "binary"}
              />
            </Section>

            <Section title={t("group.shape")}>
              <span className="field-label">{t("control.curveMode")}</span>
              <Segmented
                value={options.mode}
                ariaLabel={t("control.curveMode")}
                disabled={busy}
                onChange={(mode) => onChange({ mode })}
                options={[
                  { value: "spline", label: t("control.spline") },
                  { value: "polygon", label: t("control.polygon") },
                ]}
              />
              <Slider
                label={t("control.cornerThreshold")}
                hint={t("control.cornerThresholdHint")}
                value={options.cornerThreshold}
                min={0}
                max={180}
                suffix="°"
                onChange={(cornerThreshold) => onChange({ cornerThreshold })}
                disabled={busy}
              />
              <Slider
                label={t("control.lengthThreshold")}
                hint={t("control.lengthThresholdHint")}
                value={options.lengthThreshold}
                min={0.5}
                max={12}
                step={0.5}
                onChange={(lengthThreshold) => onChange({ lengthThreshold })}
                disabled={busy}
              />
              <Slider
                label={t("control.spliceThreshold")}
                value={options.spliceThreshold}
                min={0}
                max={90}
                suffix="°"
                onChange={(spliceThreshold) => onChange({ spliceThreshold })}
                disabled={busy}
              />
              <Slider
                label={t("control.maxIterations")}
                value={options.maxIterations}
                min={1}
                max={20}
                onChange={(maxIterations) => onChange({ maxIterations })}
                disabled={busy}
              />
              <span className="field-label">{t("control.hierarchy")}</span>
              <Segmented
                value={options.hierarchical}
                ariaLabel={t("control.hierarchy")}
                disabled={busy}
                onChange={(hierarchical) => onChange({ hierarchical })}
                options={[
                  { value: "stacked", label: t("control.stacked") },
                  { value: "cutout", label: t("control.cutout") },
                ]}
              />
            </Section>

            <Section title={t("group.filters")}>
              <Slider
                label={t("control.filterSpeckle")}
                hint={t("control.filterSpeckleHint")}
                value={options.filterSpeckle}
                min={0}
                max={32}
                suffix=" px"
                onChange={(filterSpeckle) => onChange({ filterSpeckle })}
                disabled={busy}
              />
              <Slider
                label={t("control.pathPrecision")}
                value={options.pathPrecision}
                min={0}
                max={5}
                onChange={(pathPrecision) => onChange({ pathPrecision })}
                disabled={busy}
              />
              <label className="field">
                <span className="field-label">{t("control.maxDimension")}</span>
                <select
                  value={options.maxDimension}
                  onChange={(event) => onChange({ maxDimension: Number(event.target.value) })}
                  disabled={busy}
                >
                  <option value={1500}>{t("control.sizeFast")}</option>
                  <option value={2500}>{t("control.sizePhoto")}</option>
                  <option value={3000}>{t("control.sizeRecommended")}</option>
                  <option value={4000}>{t("control.sizeDetail")}</option>
                  <option value={0}>{t("control.sizeNone")}</option>
                </select>
              </label>
              <label className="toggle">
                <span className="toggle-copy">
                  <strong>{t("control.preserveTransparency")}</strong>
                  <small>{t("control.preserveTransparencyHint")}</small>
                </span>
                <input
                  type="checkbox"
                  checked={options.preserveTransparency}
                  onChange={(event) => onChange({ preserveTransparency: event.target.checked })}
                  disabled={busy}
                />
                <span className="toggle-track" aria-hidden="true" />
              </label>
            </Section>
          </div>
        )}

        {tab === "presets" && (
          <div className="presets-panel">
            <div className="preset-list">
              {PRESET_LIST.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-card${options.preset === preset.id ? " is-active" : ""}`}
                  onClick={() => onPreset(preset.id)}
                  disabled={busy}
                >
                  <span className="preset-icon">
                    <PresetIcon id={preset.id} />
                  </span>
                  <span className="preset-copy">
                    <strong>{t(preset.labelKey)}</strong>
                    <small>{t(preset.taglineKey)}</small>
                  </span>
                  <span className="preset-check">{options.preset === preset.id ? "✓" : ""}</span>
                </button>
              ))}
            </div>
            {options.preset === "custom" && (
              <span className="badge custom-badge">{t("preset.custom")}</span>
            )}
            <p className="panel-note">{t("presets.note")}</p>
          </div>
        )}

        {tab === "output" && (
          <div className="output-panel">
            {!result ? (
              <div className="output-empty">
                <span className="output-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <rect x="7" y="8" width="34" height="32" rx="3" />
                    <path d="m12 34 8-10 5 6 4-4 7 8" />
                    <circle cx="18" cy="18" r="3" />
                  </svg>
                </span>
                <p>{t("stats.empty")}</p>
              </div>
            ) : (
              <>
                <div className="output-heading">
                  <h3>{t("group.output")}</h3>
                  <div className="output-badges">
                    {edited && <span className="badge">{t("stats.edited")}</span>}
                    <span className="badge badge--ok">{formatTime(result.elapsedMs)}</span>
                  </div>
                </div>
                <div className="stats-grid">
                  <div>
                    <strong>{result.pathCount}</strong>
                    <span>{t("stats.paths")}</span>
                  </div>
                  <div>
                    <strong>{result.colors.length}</strong>
                    <span>{t("stats.colors")}</span>
                  </div>
                  <div>
                    <strong>{formatBytes(result.byteSize)}</strong>
                    <span>{t("stats.svg")}</span>
                  </div>
                  <div>
                    <strong>
                      {result.sourceWidth}×{result.sourceHeight}
                    </strong>
                    <span>{t("stats.source")}</span>
                  </div>
                </div>

                {result.colors.length > 0 && (
                  <div className="palette-block">
                    <span className="field-label">{t("stats.palette")}</span>
                    <div className="palette" aria-label={t("stats.palette")}>
                      {result.colors.slice(0, 36).map((color) => (
                        <span
                          key={color}
                          className="swatch"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {result.colors.length > 36 && (
                        <span className="swatch-more">+{result.colors.length - 36}</span>
                      )}
                    </div>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="warning-list">
                    {warnings.map((warning, index) => (
                      <p key={`${warning.code}-${index}`}>{warningMessage(warning, t)}</p>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--accent btn--wide"
                  onClick={onSave}
                  disabled={!canSave || busy}
                >
                  {t("action.saveSvg")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <footer className="panel-footer">
        <button
          type="button"
          className="btn btn--primary btn--wide trace-action"
          onClick={onTrace}
          disabled={!canTrace || busy}
        >
          {busy ? (
            <>
              <span className="spinner spinner--small" />
              {t("action.tracing")}
            </>
          ) : (
            t("action.trace")
          )}
        </button>
      </footer>
    </aside>
  );
}
