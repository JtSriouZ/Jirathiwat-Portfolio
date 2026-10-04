import { useEffect, useRef, useState } from "react";
import { siteLabel } from "../siteCopy";

const MUSOPEN = {
  artist: "Frédéric Chopin · Musopen",
  artistUrl: "https://archive.org/details/musopen-chopin",
  license: "CC0",
  licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/"
};

const TRACKS = [
  { src: "/music/chopin-nocturne-c-sharp-minor-lento.mp3", title: "Nocturne in C-sharp Minor", ...MUSOPEN },
  { src: "/music/chopin-nocturne-c-minor-op48.mp3", title: "Nocturne in C Minor, Op. 48", ...MUSOPEN },
  { src: "/music/chopin-prelude-raindrop-op28-15.mp3", title: "Raindrop Prelude, Op. 28", ...MUSOPEN },
  { src: "/music/chopin-nocturne-b-flat-minor-op9.mp3", title: "Nocturne in B-flat Minor, Op. 9", ...MUSOPEN }
];

const LEVEL = 0.55;
const STORAGE = "atelier-sound";
const SUNK_STORAGE = "atelier-sound-sunk";

let audio = null;
let enabled = true;
let generation = 0;
let level = LEVEL;
let muted = false;

function getAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "none";
  audio.volume = muted ? 0 : level;
  return audio;
}

function applyLevel() {
  if (audio) audio.volume = muted ? 0 : level;
}

const isPlaying = () => Boolean(audio && !audio.paused && !audio.ended);

function stopSource() {
  if (!audio) return;
  audio.onended = null;
  audio.pause();
}

function playTrack(src, onEnded) {
  const element = getAudio();
  const url = new URL(src, window.location.href).href;
  if (element.src !== url) element.src = url;
  element.onended = onEnded;
  applyLevel();
  return element.play();
}

function remember(on) {
  try {
    sessionStorage.setItem(STORAGE, on ? "on" : "off");
  } catch {
    /* storage can be blocked */
  }
}

export default function AtelierSound({ profile }) {
  const tracks = Array.isArray(profile?.tracks) && profile.tracks.some((item) => item?.src)
    ? profile.tracks.filter((item) => item?.src)
    : TRACKS;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(Math.round(LEVEL * 100));
  const [isMuted, setIsMuted] = useState(false);
  const [spot, setSpot] = useState(null);
  const [side, setSide] = useState("left");
  const [dragging, setDragging] = useState(false);
  const [sunk, setSunk] = useState(() => {
    const smallScreen = window.matchMedia?.("(max-width: 640px)").matches ?? false;
    try {
      const saved = sessionStorage.getItem(SUNK_STORAGE);
      return saved ? saved === "on" : smallScreen;
    } catch {
      return smallScreen;
    }
  });
  const dragRef = useRef(null);
  const track = tracks[index % tracks.length];

  useEffect(() => {
    enabled = true;
  }, []);

  useEffect(() => {
    let closed = false;
    const mine = ++generation;

    const start = () => {
      if (!enabled || closed || mine !== generation) return;
      playTrack(track.src, () => {
        if (!closed && mine === generation) {
          setIndex((current) => (current + 1) % tracks.length);
        }
      }).then(() => {
        if (!enabled || closed || mine !== generation) {
          if (mine === generation) stopSource();
          return;
        }
        setPlaying(true);
      }).catch(() => {
        if (mine === generation) setPlaying(false);
      });
    };

    start();

    const onGesture = (event) => {
      if (event.target instanceof Element && event.target.closest(".atelier-sound")) return;
      if (!enabled || isPlaying()) return;
      start();
    };
    let scrollAttempt = 0;
    const onScroll = () => {
      if (!enabled || closed || mine !== generation) return;
      if (isPlaying()) return;
      if (scrollAttempt) return;
      scrollAttempt = window.setTimeout(() => {
        scrollAttempt = 0;
      }, 800);
      start();
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });

    return () => {
      closed = true;
      generation += 1;
      stopSource();
      window.clearTimeout(scrollAttempt);
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
    };
  }, [track.src]);

  const toggle = () => {
    if (!isPlaying()) {
      enabled = true;
      remember(true);
      playTrack(track.src, () => setIndex((current) => (current + 1) % tracks.length))
        .then(() => {
          if (enabled) setPlaying(true);
          else stopSource();
        })
        .catch(() => setPlaying(false));
      return;
    }
    enabled = false;
    remember(false);
    stopSource();
    setPlaying(false);
  };

  const skip = () => setIndex((current) => (current + 1) % tracks.length);

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

  const toggleSink = () => {
    setSunk((current) => {
      const next = !current;
      try {
        sessionStorage.setItem(SUNK_STORAGE, next ? "on" : "off");
      } catch {
        /* storage can be blocked */
      }
      return next;
    });
    setSpot(null);
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
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    const nextSide = left + box.width / 2 < viewWidth / 2 ? "left" : "right";
    const margin = 16;
    const plate = 10;
    const target = {
      x: nextSide === "left" ? margin : viewWidth - box.width - margin - plate,
      y: Math.max(margin, viewHeight - box.height - margin - plate),
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
  const sinkLabel = siteLabel(profile, sunk ? "soundRaise" : "soundSink");

  return (
    <div
      className={`atelier-sound${playing ? " is-playing" : ""}${isMuted ? " is-muted" : ""}${sunk ? " is-sunk" : ""} is-dock-${side}${dragging ? " is-dragging" : ""}`}
      style={spot ? { left: spot.x, top: spot.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <div className="atelier-sound-grip" aria-hidden="true" />
      <div className="atelier-sound-deck">
        <button
          type="button"
          className="atelier-sound-turntable"
          onClick={toggleSink}
          aria-expanded={!sunk}
          aria-label={sinkLabel}
          title={sinkLabel}
        >
          <span className="atelier-sound-disc"><span /></span>
          <svg className="atelier-sound-arm" viewBox="0 0 22 36" aria-hidden="true">
            <rect className="atelier-sound-arm-weight" x="13.6" y="0" width="4.8" height="3.4" rx="1" />
            <path className="atelier-sound-arm-rod" d="M16 6 L14.6 25 L10.4 30.6" />
            <path className="atelier-sound-arm-head" d="M9.28 29.76 L11.52 31.44 L9.42 34.24 L7.18 32.56 Z" />
            <circle className="atelier-sound-arm-base" cx="16" cy="6" r="3.6" />
            <circle className="atelier-sound-arm-pin" cx="16" cy="6" r="1.2" />
          </svg>
        </button>
        <div className="atelier-sound-body" inert={sunk}>
          <div className="atelier-sound-row">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={playing}
              aria-label={`${playing ? onLabel : offLabel}. ${track.title}${track.artist ? ` by ${track.artist}` : ""}.`}
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
            <span>{String((index % tracks.length) + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}</span>
            {track.title}
            {track.artist && (
              track.artistUrl
                ? <a href={track.artistUrl} target="_blank" rel="noreferrer">{track.artist}</a>
                : <span>{track.artist}</span>
            )}
            {track.license && (
              track.licenseUrl
                ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">{track.license}</a>
                : <span>{track.license}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
