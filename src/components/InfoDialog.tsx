import { useI18n } from "../i18n";
import Modal from "./Modal";

interface InfoDialogProps {
  kind: "shortcuts" | "about";
  onClose: () => void;
}

export default function InfoDialog({ kind, onClose }: InfoDialogProps) {
  const { t } = useI18n();

  if (kind === "shortcuts") {
    const shortcuts = [
      { keys: "Ctrl+O", label: t("shortcuts.open") },
      { keys: "Ctrl+S", label: t("shortcuts.save") },
      { keys: "Ctrl+Enter", label: t("shortcuts.trace") },
      { keys: "Ctrl+,", label: t("shortcuts.settings") },
      { keys: "Ctrl++", label: t("shortcuts.zoomIn") },
      { keys: "Ctrl+-", label: t("shortcuts.zoomOut") },
      { keys: "Ctrl+0", label: t("shortcuts.fit") },
      { keys: "Esc", label: t("shortcuts.close") },
    ];

    return (
      <Modal
        title={t("shortcuts.title")}
        onClose={onClose}
        className="info-modal"
        closeLabel={t("action.close")}
        footer={
          <button type="button" className="btn" onClick={onClose}>
            {t("settings.done")}
          </button>
        }
      >
        <ul className="shortcut-list">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.keys}>
              <span>{shortcut.label}</span>
              <kbd>{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
      </Modal>
    );
  }

  return (
    <Modal
      title={t("about.title")}
      onClose={onClose}
      className="info-modal"
      closeLabel={t("action.close")}
      footer={
        <button type="button" className="btn" onClick={onClose}>
          {t("settings.done")}
        </button>
      }
    >
      <div className="about-hero">
        <div className="about-mark" aria-hidden="true">
          V
        </div>
        <div>
          <strong>Vectorme</strong>
          <span>{t("about.version")}</span>
        </div>
      </div>
      <p className="about-text">{t("about.body")}</p>
      <p className="about-small">{t("about.engine")}</p>
      <p className="about-small">{t("about.license")}</p>
    </Modal>
  );
}
