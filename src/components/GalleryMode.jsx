import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toRoman } from "./ArtPlacard";
import { siteLabel } from "../siteCopy";

function Letters({ text }) {
  let count = 0;
  return String(text || "")
    .split(" ")
    .map((word, wordIndex) => (
      <span className="gallery-word" key={wordIndex} aria-hidden="true">
        {Array.from(word).map((letter, letterIndex) => (
          <i key={letterIndex} style={{ "--i": count++ }}>
            {letter}
          </i>
        ))}
      </span>
    ));
}

export default function GalleryMode({ open, art, index, total, profile, onPrev, onNext, onClose }) {
  const year = String(art?.date || "").match(/\d{3,4}/)?.[0];
  const byline = [art?.artist, year].filter(Boolean).join(", ");

  return (
    <div
      className={`gallery-mode${open ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label={siteLabel(profile, "galleryOpen")}
      inert={!open}
      data-no-decrypt
    >
      <span className="gallery-corner is-tl" aria-hidden="true" />
      <span className="gallery-corner is-tr" aria-hidden="true" />
      <span className="gallery-corner is-bl" aria-hidden="true" />
      <span className="gallery-corner is-br" aria-hidden="true" />
      <span className="gallery-scan" aria-hidden="true" />

      <button type="button" className="gallery-zone is-prev" onClick={onPrev} aria-label={siteLabel(profile, "galleryPrev")}>
        <ChevronLeft size={34} strokeWidth={1} />
      </button>
      <button type="button" className="gallery-zone is-next" onClick={onNext} aria-label={siteLabel(profile, "galleryNext")}>
        <ChevronRight size={34} strokeWidth={1} />
      </button>

      <button type="button" className="gallery-close" onClick={onClose}>
        <X size={14} />
        {siteLabel(profile, "galleryClose")}
        <kbd>Esc</kbd>
      </button>

      {open && art?.title && (
        <div className="gallery-caption" key={art.title}>
          <span className="gallery-kicker">
            {siteLabel(profile, "galleryKicker")} · Nº {toRoman(index + 1)} / {toRoman(Math.max(1, total))}
          </span>
          <h2 className="gallery-title" aria-label={art.title}>
            <Letters text={art.title} />
          </h2>
          {byline && <p className="gallery-by">{byline}</p>}
          {art.museum && <p className="gallery-museum">{art.museum}</p>}
        </div>
      )}

      {open && (
        <span className="gallery-numeral" key={`n-${index}`} aria-hidden="true">
          {toRoman(index + 1)}
        </span>
      )}

      <p className="gallery-hint">{siteLabel(profile, "galleryHint")}</p>
    </div>
  );
}
