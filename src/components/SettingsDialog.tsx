import { useState } from "react";
import { useI18n } from "../i18n";
import Modal from "./Modal";

interface SettingsDialogProps {
  onClose: () => void;
}

type SettingsTab = "general" | "about";

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { locale, setLocale, t } = useI18n();
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <Modal
      title={t("settings.title")}
      onClose={onClose}
      className="settings-modal"
      closeLabel={t("action.close")}
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t("settings.done")}
        </button>
      }
    >
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t("settings.title")}>
          <button
            type="button"
            className={tab === "general" ? "is-active" : ""}
            onClick={() => setTab("general")}
          >
            {t("settings.general")}
          </button>
          <button
            type="button"
            className={tab === "about" ? "is-active" : ""}
            onClick={() => setTab("about")}
          >
            {t("settings.about")}
          </button>
        </nav>

        <div className="settings-content">
          {tab === "general" ? (
            <>
              <section className="settings-section">
                <h3>{t("settings.language")}</h3>
                <p>{t("settings.languageHint")}</p>
                <div className="language-options">
                  <button
                    type="button"
                    className={`language-card${locale === "en" ? " is-active" : ""}`}
                    onClick={() => setLocale("en")}
                  >
                    <span className="language-code">EN</span>
                    <span className="language-copy">
                      <strong>{t("settings.english")}</strong>
                      <small>{t("settings.englishHint")}</small>
                    </span>
                    <span className="language-check">{locale === "en" ? "✓" : ""}</span>
                  </button>
                  <button
                    type="button"
                    className={`language-card${locale === "pl" ? " is-active" : ""}`}
                    onClick={() => setLocale("pl")}
                  >
                    <span className="language-code">PL</span>
                    <span className="language-copy">
                      <strong>{t("settings.polish")}</strong>
                      <small>{t("settings.polishHint")}</small>
                    </span>
                    <span className="language-check">{locale === "pl" ? "✓" : ""}</span>
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3>{t("settings.theme")}</h3>
                <div className="settings-value">
                  <span>{t("settings.themeDark")}</span>
                  <small>{t("settings.themeHint")}</small>
                </div>
              </section>
            </>
          ) : (
            <section className="settings-section about-section">
              <div className="about-mark" aria-hidden="true">
                V
              </div>
              <h3>{t("about.title")}</h3>
              <p>{t("about.body")}</p>
              <dl className="about-list">
                <div>
                  <dt>{t("settings.version")}</dt>
                  <dd>0.1.0</dd>
                </div>
                <div>
                  <dt>{t("settings.engine")}</dt>
                  <dd>VTracer 0.6.5</dd>
                </div>
                <div>
                  <dt>{t("settings.license")}</dt>
                  <dd>MIT</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
