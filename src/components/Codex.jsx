import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { siteLabel } from "../siteCopy";

const HINT_STORAGE = "atelier-codex-hint";

export default function Codex({ open, profile, onClose }) {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;
    try {
      if (sessionStorage.getItem(HINT_STORAGE)) return undefined;
      sessionStorage.setItem(HINT_STORAGE, "shown");
    } catch {
      /* storage can be blocked */
    }
    const show = window.setTimeout(() => setHint(true), 5200);
    const hide = window.setTimeout(() => setHint(false), 11800);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (open) setHint(false);
  }, [open]);

  const rows = [
    [["G"], siteLabel(profile, "codexGallery")],
    [["←", "→"], siteLabel(profile, "codexArt")],
    [["1", "–", "6"], siteLabel(profile, "codexPages")],
    [["M"], siteLabel(profile, "codexSound")],
    [["?"], siteLabel(profile, "codexToggle")],
    [["Esc"], siteLabel(profile, "codexEscape")],
  ];

  return (
    <>
      <p className={`codex-hint${hint ? " is-shown" : ""}`} aria-hidden="true">
        <kbd>?</kbd>
        {siteLabel(profile, "codexHint")}
      </p>
      <div
        className={`codex${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={siteLabel(profile, "codexTitle")}
        inert={!open}
        data-no-decrypt
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="codex-panel">
          <header>
            <span>◇ Clavis</span>
            <h2>{siteLabel(profile, "codexTitle")}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label={siteLabel(profile, "codexEscape")}>
              <X size={16} />
            </button>
          </header>
          <ul>
            {rows.map(([keys, label], index) => (
              <li key={label} style={{ "--i": index }}>
                <span className="codex-keys">
                  {keys.map((key) => (key === "–" ? <em key={key}>–</em> : <kbd key={key}>{key}</kbd>))}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
