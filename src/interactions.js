const LENS_HOST = ":is(.project-card, .home-post-card, .post-card, .project-showcase) :is(.thumb, .home-post-media)";
const LENS_RADIUS = 78;
const SEAL_SKIP = "input, textarea, select, [contenteditable='true'], .admin-shell, .atelier-sound";

const finePointer = () => window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function startInfraredLens(root = document) {
  if (!finePointer() || reducedMotion()) return () => {};

  let active = null;
  let point = null;
  let frame = 0;

  const open = (host) => {
    const subject = host.querySelector("img.thumb-subject") || host.querySelector("img:not(.thumb-fill):not(.thumb-lens)");
    if (!subject || !subject.complete || !subject.naturalWidth) return null;

    const lens = subject.cloneNode(false);
    lens.removeAttribute("id");
    lens.removeAttribute("loading");
    lens.alt = "";
    lens.setAttribute("aria-hidden", "true");
    lens.classList.add("thumb-lens");
    Object.assign(lens.style, {
      position: "absolute",
      left: `${subject.offsetLeft}px`,
      top: `${subject.offsetTop}px`,
      width: `${subject.offsetWidth}px`,
      height: `${subject.offsetHeight}px`,
      zIndex: getComputedStyle(subject).zIndex,
    });
    subject.after(lens);

    const ring = document.createElement("span");
    ring.className = "thumb-lens-ring";
    ring.setAttribute("aria-hidden", "true");
    host.append(ring);

    const state = { host, lens, ring };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (active === state) host.classList.add("is-lensing");
    }));
    return state;
  };

  const close = (state) => {
    if (!state) return;
    state.lens.classList.add("is-closing");
    state.ring.classList.add("is-closing");
    state.host.classList.remove("is-lensing");
    window.setTimeout(() => {
      state.lens.remove();
      state.ring.remove();
    }, 420);
  };

  const update = () => {
    frame = 0;
    if (!active || !point) return;
    const { host, lens } = active;
    const box = host.getBoundingClientRect();
    host.style.setProperty("--lx", `${(point.x - box.left).toFixed(1)}px`);
    host.style.setProperty("--ly", `${(point.y - box.top).toFixed(1)}px`);
    const img = lens.getBoundingClientRect();
    const scaleX = lens.offsetWidth / Math.max(1, img.width);
    const scaleY = lens.offsetHeight / Math.max(1, img.height);
    lens.style.setProperty("--mx", `${((point.x - img.left) * scaleX).toFixed(1)}px`);
    lens.style.setProperty("--my", `${((point.y - img.top) * scaleY).toFixed(1)}px`);
    lens.style.setProperty("--mr", `${(LENS_RADIUS * scaleX).toFixed(1)}px`);
  };

  const onMove = (event) => {
    const host = event.target instanceof Element ? event.target.closest(LENS_HOST) : null;
    if (host !== active?.host) {
      close(active);
      active = host ? open(host) : null;
    }
    if (!active) return;
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onLeave = () => {
    close(active);
    active = null;
  };

  root.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  window.addEventListener("scroll", onLeave, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    onLeave();
    root.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("mouseleave", onLeave);
    window.removeEventListener("scroll", onLeave);
  };
}

export function startClickSeal(root = document) {
  if (reducedMotion()) return () => {};

  const onDown = (event) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(SEAL_SKIP)) return;
    const seal = document.createElement("span");
    seal.className = event.target instanceof Element && event.target.closest("a, button, [role='button']")
      ? "click-seal is-strong"
      : "click-seal";
    seal.setAttribute("aria-hidden", "true");
    seal.style.left = `${event.clientX}px`;
    seal.style.top = `${event.clientY}px`;
    seal.innerHTML = "<i></i>";
    document.body.append(seal);
    window.setTimeout(() => seal.remove(), 900);
  };

  root.addEventListener("pointerdown", onDown, { passive: true });
  return () => root.removeEventListener("pointerdown", onDown);
}
