import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "../utils";

const STILL_HOLD_MS = 5600;

function shuffleStills(list) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export default function StillGrid({ profile }) {
  const stills = Array.isArray(profile.stills) ? profile.stills.filter((item) => item?.image) : [];
  const orderKey = stills.map((item) => item.id || item.image).join("|");
  const order = useMemo(() => shuffleStills(stills), [orderKey]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [orderKey]);

  useEffect(() => {
    if (paused || reducedMotion || order.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % order.length);
    }, STILL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [index, order.length, paused, reducedMotion]);

  if (!order.length) return null;

  const handle = (profile.handle || "jtsriouz_o").replace(/^@/, "");
  const current = index % order.length;
  const still = order[current];
  const step = (direction) => {
    setIndex((value) => (value + direction + order.length) % order.length);
  };

  return (
    <section className="section still-section reveal">
      <div
        className={`still-stage${paused ? " is-paused" : ""}${reducedMotion ? " is-reduced" : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <ol className="still-index">
          {order.map((item, itemIndex) => (
            <li key={item.id || item.image}>
              <button
                type="button"
                className={itemIndex === current ? "is-current" : ""}
                aria-current={itemIndex === current ? "true" : undefined}
                onClick={() => setIndex(itemIndex)}
              >
                <em>{String(itemIndex + 1).padStart(2, "0")}</em>
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <a
          className="still-plate"
          href={still.href || profile.instagram}
          target="_blank"
          rel="noreferrer"
        >
          <figure>
            <img
              key={still.id || still.image}
              src={resolveMediaUrl(still.image)}
              alt={still.title || `Still by @${handle}`}
            />
          </figure>
          <p>
            <span>Fig. {String(current + 1).padStart(2, "0")}</span>
            <span>@{handle}</span>
          </p>
        </a>

        <div className="still-copy">
          <p className="still-kicker">{profile.headings?.stillsTitle || "From the feed"}</p>
          <h2 key={still.id || still.image}>{still.title}</h2>
          <em>{still.date}</em>
          <p className="section-note">
            {profile.headings?.stillsDesc || `One still at a time from @${handle}.`}
          </p>
          <div className="still-meter" aria-hidden="true">
            <i key={`${still.id || still.image}-${current}`} />
          </div>
          <div className="still-controls">
            <button type="button" onClick={() => step(-1)}>
              <ChevronLeft size={16} />
              Prev
            </button>
            <button type="button" onClick={() => step(1)}>
              Next
              <ChevronRight size={16} />
            </button>
            {profile.instagram && (
              <a href={still.href || profile.instagram} target="_blank" rel="noreferrer">
                Open post
              </a>
            )}
          </div>
          <span className="still-folio" aria-hidden="true">I</span>
        </div>
      </div>
    </section>
  );
}
