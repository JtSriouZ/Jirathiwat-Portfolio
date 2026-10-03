import { useEffect, useRef, useState } from "react";
import { siteLabel } from "../siteCopy";

const TRACKS = [
  { src: "/music/deep-house-sunset.mp3", title: "Deep House Sunset" },
  { src: "/music/cocktail-bar.mp3", title: "Cocktail Bar" },
  { src: "/music/midnight-club.mp3", title: "Midnight Club" },
];

const LEVEL = 0.55;
const STORAGE = "atelier-sound";

let ctx = null;
let gain = null;
let source = null;
let enabled = true;
let generation = 0;
let level = LEVEL;
let muted = false;
const decoded = new Map();

function getContext() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  ctx = new Ctx();
  gain = ctx.createGain();
  gain.gain.value = muted ? 0 : level;
  gain.connect(ctx.destination);
  return ctx;
}

function applyLevel() {
  if (!ctx || !gain) return;
  const value = muted ? 0 : level;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(value, ctx.currentTime);
}

function stopSource() {
  const node = source;
  source = null;
  if (!node) return;
  node.onended = null;
  try {
    node.stop();
  } catch {
    /* already finished */
  }
  try {
    node.disconnect();
  } catch {
    /* already disconnected */
  }
}

async function loadBuffer(src) {
  const url = new URL(src, window.location.href).href;
  if (decoded.has(url)) return decoded.get(url);
  const context = getContext();
  const response = await fetch(url);
  const raw = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(raw.slice(0));
  decoded.set(url, buffer);
  return buffer;
}

function playBuffer(buffer, onEnded) {
  const context = getContext();
  stopSource();
  const node = context.createBufferSource();
  node.buffer = buffer;
  node.connect(gain);
  node.onended = () => {
    if (source !== node) return;
    source = null;
    onEnded();
  };
  source = node;
  applyLevel();
  node.start();
}

function remember(on) {
  try {
    sessionStorage.setItem(STORAGE, on ? "on" : "off");
  } catch {
    /* storage can be blocked */
  }
}

export default function AtelierSound({ profile }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(Math.round(LEVEL * 100));
  const [isMuted, setIsMuted] = useState(false);
  const [spot, setSpot] = useState(null);
  const [side, setSide] = useState("left");
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const track = TRACKS[index];

  useEffect(() => {
    enabled = true;
  }, []);

  useEffect(() => {
    let closed = false;
    const mine = ++generation;
    const context = getContext();

    const start = () => {
      if (!enabled || closed || mine !== generation) return;
      context.resume().then(() => loadBuffer(track.src)).then((buffer) => {
        if (!enabled || closed || mine !== generation) return;
        if (context.state !== "running") {
          setPlaying(false);
          return;
        }
        playBuffer(buffer, () => {
          if (!closed && mine === generation) {
            setIndex((current) => (current + 1) % TRACKS.length);
          }
        });
        setPlaying(true);
      }).catch(() => {
        if (mine === generation) setPlaying(false);
      });
    };

    start();

    const onGesture = (event) => {
      if (event.target instanceof Element && event.target.closest(".atelier-sound")) return;
      if (!enabled || (context.state === "running" && source)) return;
      start();
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);

    return () => {
      closed = true;
      generation += 1;
      stopSource();
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, [track.src]);

  const toggle = () => {
    const context = getContext();
    if (!source) {
      enabled = true;
      remember(true);
      context.resume().then(() => loadBuffer(track.src)).then((buffer) => {
        if (!enabled) return;
        playBuffer(buffer, () => setIndex((current) => (current + 1) % TRACKS.length));
        setPlaying(true);
      }).catch(() => setPlaying(false));
      return;
    }
    enabled = false;
    remember(false);
    stopSource();
    setPlaying(false);
  };

  const skip = () => setIndex((current) => (current + 1) % TRACKS.length);

  const changeVolume = (value) => {
    const next = Number(value);
    level = next / 100;
    setVolume(next);
    if (next > 0 && muted) {
      muted = false;
      setIsMuted(false);
    }
    applyLevel();
  };

  const toggleMute = () => {
    muted = !muted;
    setIsMuted(muted);
    applyLevel();
  };

  const onDragStart = (event) => {
    if (event.target.closest("button, input, a")) return;
    const box = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    };
    setDragging(true);
    setSpot({ x: box.left, y: box.top });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is optional when the pointer is already released */
    }
  };

  const onDragMove = (event) => {
    if (!dragRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - dragRef.current.x;
    const y = Math.min(window.innerHeight - 28, Math.max(8, event.clientY - dragRef.current.y));
    setSpot({ x, y: Math.min(y, window.innerHeight - box.height - 8) });
  };

  const onDragEnd = (event) => {
    if (!dragRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const left = event.clientX - dragRef.current.x;
    const nextSide = left + box.width / 2 < window.innerWidth / 2 ? "left" : "right";
    const margin = 16;
    const target = {
      x: nextSide === "left" ? margin : window.innerWidth - box.width - margin,
      y: Math.max(margin, window.innerHeight - box.height - margin),
    };
    dragRef.current = null;
    setSide(nextSide);
    setDragging(false);
    window.requestAnimationFrame(() => setSpot(target));
  };

  const onLabel = siteLabel(profile, "soundOn");
  const offLabel = siteLabel(profile, "soundOff");
  const skipLabel = siteLabel(profile, "soundSkip");
  const muteLabel = siteLabel(profile, isMuted ? "soundUnmute" : "soundMute");
  const volumeLabel = siteLabel(profile, "soundVolume");

  return (
    <div
      className={`atelier-sound${playing ? " is-playing" : ""}${isMuted ? " is-muted" : ""} is-dock-${side}${dragging ? " is-dragging" : ""}`}
      style={spot ? { left: spot.x, top: spot.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <div className="atelier-sound-grip" aria-hidden="true" />
      <div className="atelier-sound-row">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={`${playing ? onLabel : offLabel}. ${track.title} by Alex Morgan.`}
        >
          <i aria-hidden="true"><span /><span /><span /></i>
          {playing ? onLabel : offLabel}
        </button>
        <button type="button" onClick={skip} aria-label={skipLabel}>{skipLabel}</button>
        <button type="button" onClick={toggleMute} aria-pressed={isMuted} aria-label={muteLabel}>{muteLabel}</button>
      </div>
      <label className="atelier-sound-volume">
        <span className="atelier-sound-sr">{volumeLabel}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={isMuted ? 0 : volume}
          aria-label={volumeLabel}
          onChange={(event) => changeVolume(event.target.value)}
        />
      </label>
      <p>
        <span>{String(index + 1).padStart(2, "0")} / {String(TRACKS.length).padStart(2, "0")}</span>
        {track.title}
        <a href="https://freemusicarchive.org/music/alex-morgan/" target="_blank" rel="noreferrer">Alex Morgan</a>
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY</a>
      </p>
    </div>
  );
}
