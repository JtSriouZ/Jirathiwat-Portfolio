import { useEffect, useRef, useState } from "react";
import { holdDecrypt } from "../decrypt";
import { GateDoors } from "./RouteCurtain";

const SEEN_KEY = "grand-entrance-seen";
const COUNT_MS = 1500;
const LIFT_AT = 1900;
const LIFT_MS = 1500;
const DELAY_RELEASE_AT = 5200;

function shouldPlay() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export default function GrandEntrance({ name, tagline }) {
  const [phase, setPhase] = useState(() => (shouldPlay() ? "in" : "done"));
  const [count, setCount] = useState(0);
  const playing = useRef(phase !== "done");

  useEffect(() => {
    if (!playing.current) return undefined;
    const root = document.documentElement;
    root.classList.add("has-entrance");
    holdDecrypt(LIFT_AT + 150);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage can be blocked */
    }

    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / COUNT_MS);
      setCount(Math.round(easeOut(progress) * 100));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    const lift = setTimeout(() => setPhase((current) => (current === "in" ? "out" : current)), LIFT_AT);
    const release = setTimeout(() => root.classList.remove("has-entrance"), DELAY_RELEASE_AT);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(lift);
      clearTimeout(release);
      root.classList.remove("has-entrance");
    };
  }, []);

  useEffect(() => {
    if (phase !== "out") return undefined;
    const end = setTimeout(() => setPhase("done"), LIFT_MS);
    return () => clearTimeout(end);
  }, [phase]);

  if (phase === "done") return null;

  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  const monogram = words.map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  let letterIndex = 0;

  return (
    <div
      className={`grand-entrance is-${phase}`}
      aria-hidden="true"
      onClick={() => setPhase("out")}
    >
      <GateDoors leftLabel="Nº I · Atelier" />
      <div className="gate-plaque">
        <i className="gate-sweep" />
        <span className="gate-mark">
          {monogram}
          <i className="gate-pulse" />
        </span>
        <p className="gate-title">
          {words.map((word, wordIndex) => (
            <span className="gate-word" key={`${word}-${wordIndex}`}>
              {Array.from(word).map((letter) => (
                <i key={letterIndex} style={{ "--i": letterIndex++ }}>
                  {letter}
                </i>
              ))}
            </span>
          ))}
        </p>
        <div className="gate-ticks">
          <i style={{ transform: `scaleX(${count / 100})` }} />
        </div>
        <div className="gate-meta">
          <span>{tagline}</span>
          <span>{String(count).padStart(3, "0")}</span>
        </div>
      </div>
    </div>
  );
}
