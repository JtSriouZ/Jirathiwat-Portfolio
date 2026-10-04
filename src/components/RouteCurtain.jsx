import { useEffect, useState } from "react";
import { EUROPEAN_ART } from "../europeanArt";

const CURTAIN_MS = 2500;
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

function pickArt(paintings = []) {
  const pool = paintings.filter(Boolean);
  const source = pool.length ? pool : EUROPEAN_ART;
  return source[Math.floor(Math.random() * source.length)];
}

export function GateDoors({ leftLabel, rightLabel = YEAR, paintings = [] }) {
  const poolKey = paintings.filter(Boolean).join("|");
  const [art, setArt] = useState(() => pickArt(paintings));

  useEffect(() => {
    const pool = poolKey ? poolKey.split("|") : [];
    if (!pool.length || pool.includes(art)) return;
    setArt(pickArt(pool));
  }, [poolKey, art]);

  const artStyle = { "--gate-art": `url("${art}")` };

  return (
    <>
      <i className="gate-flare" />
      <div className="gate-panel is-left" style={artStyle}>
        <i className="gate-art" />
        <i className="gate-teeth" />
        <i className="gate-scan" />
        <span className="gate-corner">{leftLabel}</span>
      </div>
      <div className="gate-panel is-right" style={artStyle}>
        <i className="gate-art" />
        <i className="gate-teeth" />
        <i className="gate-scan" />
        <span className="gate-corner">{rightLabel}</span>
      </div>
      <i className="gate-seam" />
    </>
  );
}

export default function RouteCurtain({ label, index = 0, total = NUMERALS.length, paintings = [] }) {
  const [done, setDone] = useState(false);
  const letters = Array.from(String(label || ""));
  const numeral = NUMERALS[index] || NUMERALS[0];

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), CURTAIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div className="route-wipe" aria-hidden="true">
      <GateDoors leftLabel={`Nº ${numeral}`} paintings={paintings} />
      <div className="gate-plaque">
        <i className="gate-sweep" />
        <span className="gate-mark is-numeral">
          {numeral}
          <i className="gate-pulse" />
        </span>
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
