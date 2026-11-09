import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import type { ViewerMode } from "../types";

interface MenuBarProps {
  mode: ViewerMode;
  hasImage: boolean;
  hasResult: boolean;
  busy: boolean;
  onOpen: () => void;
  onSave: () => void;
  onTrace: () => void;
  onReset: () => void;
  onQuit: () => void;
  onSettings: () => void;
  onMode: (mode: ViewerMode) => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShortcuts: () => void;
  onAbout: () => void;
}

type MenuEntry =
  | { separator: true }
  | {
      separator?: false;
      label: string;
      shortcut?: string;
      action: () => void;
      disabled?: boolean;
      checked?: boolean;
    };

export default function MenuBar({
  mode,
  hasImage,
  hasResult,
  busy,
  onOpen,
  onSave,
  onTrace,
  onReset,
  onQuit,
  onSettings,
  onMode,
  onFit,
  onZoomIn,
  onZoomOut,
  onShortcuts,
  onAbout,
}: MenuBarProps) {
  const { t } = useI18n();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const menus: Array<{ id: string; label: string; items: MenuEntry[] }> = [
    {
      id: "file",
      label: t("menu.file"),
      items: [
        { label: t("menu.open"), shortcut: "Ctrl+O", action: onOpen },
        {
          label: t("menu.save"),
          shortcut: "Ctrl+S",
          action: onSave,
          disabled: !hasResult || busy,
        },
        { separator: true },
        {
          label: t("menu.closeImage"),
          action: onReset,
          disabled: !hasImage,
        },
        { separator: true },
        { label: t("menu.quit"), action: onQuit },
      ],
    },
    {
      id: "edit",
      label: t("menu.edit"),
      items: [
        {
          label: t("menu.trace"),
          shortcut: "Ctrl+Enter",
          action: onTrace,
          disabled: !hasImage || busy,
        },
        { separator: true },
        { label: t("menu.settings"), shortcut: "Ctrl+,", action: onSettings },
      ],
    },
    {
      id: "view",
      label: t("menu.view"),
      items: [
        {
          label: t("menu.result"),
          action: () => onMode("result"),
          disabled: !hasResult,
          checked: mode === "result",
        },
        {
          label: t("menu.original"),
          action: () => onMode("source"),
          disabled: !hasImage,
          checked: mode === "source",
        },
        {
          label: t("menu.compare"),
          action: () => onMode("split"),
          disabled: !hasResult,
          checked: mode === "split",
        },
        {
          label: t("menu.editNodes"),
          action: () => onMode("edit"),
          disabled: !hasResult,
          checked: mode === "edit",
        },
        { separator: true },
        { label: t("menu.zoomIn"), shortcut: "Ctrl++", action: onZoomIn, disabled: !hasImage },
        { label: t("menu.zoomOut"), shortcut: "Ctrl+-", action: onZoomOut, disabled: !hasImage },
        { label: t("menu.fit"), shortcut: "Ctrl+0", action: onFit, disabled: !hasImage },
      ],
    },
    {
      id: "help",
      label: t("menu.help"),
      items: [
        { label: t("menu.shortcuts"), shortcut: "F1", action: onShortcuts },
        { separator: true },
        { label: t("menu.about"), action: onAbout },
      ],
    },
  ];

  return (
    <header className="menubar" ref={barRef}>
      <div className="menubar-brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <rect width="48" height="48" rx="10" fill="#242424" />
            <path
              d="M12 14 24 36 36 14"
              fill="none"
              stroke="url(#brand-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f26a3d" />
                <stop offset="1" stopColor="#f7a23b" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span className="brand-name">{t("app.name")}</span>
      </div>

      <nav className="menubar-menus" aria-label={t("menu.main")}>
        {menus.map((menu) => (
          <div className="menu-root" key={menu.id}>
            <button
              type="button"
              className={`menu-trigger${openMenu === menu.id ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === menu.id ? null : menu.id))}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(menu.id);
              }}
              aria-haspopup="menu"
              aria-expanded={openMenu === menu.id}
            >
              {menu.label}
            </button>
            {openMenu === menu.id && (
              <div className="menu-popover" role="menu">
                {menu.items.map((item, index) =>
                  "separator" in item && item.separator ? (
                    <div className="menu-separator" key={`sep-${index}`} role="separator" />
                  ) : (
                    "label" in item && (
                      <button
                        key={item.label}
                        type="button"
                        className={`menu-item${item.checked ? " is-checked" : ""}`}
                        role="menuitem"
                        disabled={item.disabled}
                        onClick={() => {
                          setOpenMenu(null);
                          item.action();
                        }}
                      >
                        <span className="menu-check" aria-hidden="true">
                          {item.checked ? "✓" : ""}
                        </span>
                        <span className="menu-label">{item.label}</span>
                        {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                      </button>
                    )
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="menubar-right">
        <span className="offline-pill">
          <span className="status-dot" />
          {t("app.offline")}
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={onSettings}
          title={t("action.settings")}
          aria-label={t("action.settings")}
        >
          <GearIcon />
        </button>
      </div>
    </header>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.6-1.2-1.8-3.1-1.9.8a7.6 7.6 0 0 0-2.6-1.5L14.4 3h-3.6l-.3 2.5a7.6 7.6 0 0 0-2.6 1.5l-1.9-.8-1.8 3.1L5.8 10.5a7.7 7.7 0 0 0 0 3l-1.6 1.2 1.8 3.1 1.9-.8a7.6 7.6 0 0 0 2.6 1.5l.3 2.5h3.6l.3-2.5a7.6 7.6 0 0 0 2.6-1.5l1.9.8 1.8-3.1-1.6-1.2Z" />
    </svg>
  );
}
