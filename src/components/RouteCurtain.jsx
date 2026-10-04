const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

export function romanYear(year = new Date().getFullYear()) {
  let rest = year;
  let out = "";
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

const YEAR = romanYear();

export default function RouteCurtain({ label, index = 0, total = NUMERALS.length }) {
  const letters = Array.from(String(label || ""));
  const numeral = NUMERALS[index] || NUMERALS[0];

  return (
    <div className="route-wipe" aria-hidden="true">
      <div className="gate-panel is-left">
        <span className="gate-corner">Nº {numeral}</span>
      </div>
      <div className="gate-panel is-right">
        <span className="gate-corner">{YEAR}</span>
      </div>
      <i className="gate-seam" />
      <div className="gate-plaque">
        <span className="gate-mark is-numeral">{numeral}</span>
        <span className="gate-title" style={{ "--n": Math.max(4, letters.length) }}>
          <span className="gate-word">
            {letters.map((letter, letterIndex) => (
              <i key={letterIndex} style={{ "--i": letterIndex }}>
                {letter === " " ? "\u00a0" : letter}
              </i>
            ))}
          </span>
        </span>
        <div className="gate-ticks">
          <i />
        </div>
        <div className="gate-meta">
          <span>Folio</span>
          <span>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
