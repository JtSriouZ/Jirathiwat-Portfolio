const NUMERALS = [
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value) {
  let rest = Math.max(1, Math.floor(value));
  let out = "";
  NUMERALS.forEach(([size, mark]) => {
    while (rest >= size) {
      out += mark;
      rest -= size;
    }
  });
  return out;
}

export default function ArtPlacard({ art, index, label, sourceLabel, openLabel, onOpen }) {
  if (!art?.title) return null;

  const year = String(art.date || "").match(/\d{3,4}/)?.[0];
  const byline = [art.artist, year].filter(Boolean).join(", ");

  return (
    <aside className="art-placard" aria-label={`${label}: ${art.title}`}>
      <span className="art-placard-folio">
        {label} · Nº {toRoman(index + 1)}
      </span>
      <strong>{art.title}</strong>
      {byline && <span className="art-placard-by">{byline}</span>}
      {art.museum && <span className="art-placard-museum">{art.museum}</span>}
      <span className="art-placard-actions">
        {onOpen && (
          <button type="button" onClick={onOpen}>
            {openLabel} <kbd>G</kbd>
          </button>
        )}
        {art.link && (
          <a href={art.link} target="_blank" rel="noreferrer">
            {sourceLabel}
          </a>
        )}
      </span>
    </aside>
  );
}
