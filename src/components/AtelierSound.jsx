import { useEffect, useRef, useState } from "react";
import { siteLabel } from "../siteCopy";

const TRACKS = [
  { src: "/music/gymnopedie-1.mp3", title: "Gymnopédie No. 1" },
  { src: "/music/evening-fall.mp3", title: "Evening Fall" },
  { src: "/music/gymnopedie-3.mp3", title: "Gymnopédie No. 3" },
];

const TARGET = 0.42;
const STORAGE = "atelier-sound";

function fadeVolume(audio, to, ms, tokenRef) {
  const token = {};
  tokenRef.current = token;
  const from = audio.volume;
  const start = performance.now();
  const tick = (now) => {
    if (tokenRef.current !== token) return;
    const progress = Math.min(1, (now - start) / ms);
    audio.volume = from + (to - from) * progress;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function AtelierSound({ profile }) {
  const audioRef = useRef(null);
  const wantRef = useRef((() => {
  try {
    return sessionStorage.getItem(STORAGE) !== "off";
  } catch {
    return true;
  }
})());
  const fadeRef = useRef(null);
  const turnRef = useRef(0);
  const failsRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const track = TRACKS[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    let gone = false;
    let starting = false;

    const begin = () => {
      if (gone || !wantRef.current || starting || !audio.paused) return;
      starting = true;
      audio.play().then(() => {
        starting = false;
        if (gone || !wantRef.current) {
          audio.pause();
          return;
        }
        failsRef.current = 0;
        setPlaying(true);
        fadeVolume(audio, TARGET, 1200, fadeRef);
      }).catch(() => {
        starting = false;
        if (!gone) setPlaying(false);
      });
    };

    audio.loop = false;
    audio.src = track.src;
    audio.volume = 0;
    begin();

    const onEnded = () => {
      failsRef.current = 0;
      setIndex((current) => (current + 1) % TRACKS.length);
    };
    const onError = () => {
      failsRef.current += 1;
      if (failsRef.current >= TRACKS.length) return;
      setIndex((current) => (current + 1) % TRACKS.length);
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", begin);
    return () => {
      gone = true;
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("canplay", begin);
    };
  }, [track.src]);

  useEffect(() => {
    const onPointer = (event) => {
      if (event.target instanceof Element && event.target.closest(".atelier-sound")) return;
      const audio = audioRef.current;
      if (!audio || !wantRef.current || !audio.paused) return;
      audio.play().then(() => {
        setPlaying(true);
        fadeVolume(audio, TARGET, 900, fadeRef);
      }).catch(() => {});
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onPointer, true);
    return () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onPointer, true);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const turn = ++turnRef.current;
    if (audio.paused) {
      wantRef.current = true;
      sessionStorage.setItem(STORAGE, "on");
      audio.play().then(() => {
        if (turnRef.current !== turn) return;
        setPlaying(true);
        fadeVolume(audio, TARGET, 700, fadeRef);
      }).catch(() => setPlaying(false));
      return;
    }
    wantRef.current = false;
    sessionStorage.setItem(STORAGE, "off");
    fadeVolume(audio, 0, 280, fadeRef);
    window.setTimeout(() => {
      if (turnRef.current !== turn || wantRef.current) return;
      audio.pause();
      setPlaying(false);
    }, 280);
  };

  const onLabel = siteLabel(profile, "soundOn");
  const offLabel = siteLabel(profile, "soundOff");

  return (
    <div className={`atelier-sound${playing ? " is-playing" : ""}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={`${playing ? onLabel : offLabel}. ${track.title} by Kevin MacLeod.`}
      >
        <i aria-hidden="true"><span /><span /><span /></i>
        {playing ? onLabel : offLabel}
      </button>
      <p>
        <span>{String(index + 1).padStart(2, "0")} / {String(TRACKS.length).padStart(2, "0")}</span>
        {track.title}
        <a href="https://incompetech.com" target="_blank" rel="noreferrer">Kevin MacLeod</a>
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY</a>
      </p>
      <audio ref={audioRef} preload="auto" playsInline />
    </div>
  );
}
