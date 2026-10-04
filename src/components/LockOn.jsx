import { useEffect, useRef, useState } from "react";

const TARGETS = ".project-card, .home-post-card, .post-card, .certificate-card";

export default function LockOn() {
  const [box, setBox] = useState(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = targetRef.current;
      if (!el || !el.isConnected) {
        targetRef.current = null;
        setBox((prev) => (prev && prev.on ? { ...prev, on: false } : prev));
        return;
      }
      const rect = el.getBoundingClientRect();
      setBox((prev) => {
        const same = prev?.el === el;
        if (same && prev.on && prev.x === rect.left && prev.y === rect.top && prev.w === rect.width && prev.h === rect.height) {
          return prev;
        }
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
        return {
          el,
          on: true,
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
          index: siblings.indexOf(el) + 1,
          key: same ? prev.key : (prev?.key || 0) + 1
        };
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const over = (event) => {
      const el = event.target instanceof Element ? event.target.closest(TARGETS) : null;
      if (el !== targetRef.current) {
        targetRef.current = el;
        schedule();
      }
    };
    const move = () => {
      if (targetRef.current) schedule();
    };
    const leave = () => {
      targetRef.current = null;
      schedule();
    };

    document.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerover", over);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  if (!box) return null;

  return (
    <div
      className={`lock-on${box.on ? " is-on" : ""}`}
      aria-hidden="true"
      style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }}
    >
      <div className="lock-on-frame" key={box.key}>
        <i className="is-tl" />
        <i className="is-tr" />
        <i className="is-bl" />
        <i className="is-br" />
        <span className="lock-on-tag">◇ Inspice · Nº {String(box.index).padStart(2, "0")}</span>
        <i className="lock-on-scan" />
      </div>
    </div>
  );
}
