const HEADING_SELECTOR = "h1, h2, h3, h4, .project-count";
const EXCLUDED = ".grand-entrance, .route-wipe, .footer-wordmark, .admin-shell, [data-no-decrypt]";
const GREEK = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
const ROMAN = "IVXLCDM";
const HASH_MS = 160;
const CAESAR_MS = 260;
const CAESAR_STEP_MS = 65;

let holdUntil = 0;

export function holdDecrypt(ms) {
  holdUntil = Math.max(holdUntil, performance.now() + ms);
}

const pick = (set) => set[Math.floor(Math.random() * set.length)];

function caesar(character, shift) {
  const code = character.charCodeAt(0);
  const base = code >= 97 ? 97 : 65;
  return String.fromCharCode(((code - base + shift) % 26) + base);
}

function decryptElement(element, { duration: fixedDuration, className = "is-scrambling", onDone } = {}) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const items = [];
  let total = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim()) continue;
    items.push({ node, final: node.nodeValue, written: node.nodeValue, base: total });
    total += node.nodeValue.length;
  }
  if (!items.length) {
    onDone?.();
    return;
  }

  const duration = fixedDuration ?? Math.max(720, Math.min(1600, total * 46));
  const span = duration - HASH_MS - 120;
  const settleAt = Array.from({ length: total }, (_, index) => HASH_MS + (index / total) * span + Math.random() * 120);
  const addedLabel = !element.hasAttribute("aria-label");
  if (addedLabel) element.setAttribute("aria-label", element.textContent.trim());
  element.classList.add(className);

  const start = performance.now();
  const tick = (now) => {
    const elapsed = now - start;
    let pending = false;

    items.forEach((item) => {
      if (item.stale || item.node.nodeValue !== item.written) {
        item.stale = true;
        return;
      }
      let text = "";
      for (let index = 0; index < item.final.length; index += 1) {
        const character = item.final[index];
        const left = settleAt[item.base + index] - elapsed;
        if (left <= 0 || /\s/.test(character)) {
          text += character;
          continue;
        }
        pending = true;
        if (elapsed < HASH_MS) text += pick(ROMAN);
        else if (left < CAESAR_MS && /[A-Za-z]/.test(character)) text += caesar(character, Math.ceil(left / CAESAR_STEP_MS));
        else text += (item.base + index) % 7 === 3 ? "·" : pick(GREEK);
      }
      item.node.nodeValue = text;
      item.written = text;
    });

    if (pending) {
      requestAnimationFrame(tick);
      return;
    }
    items.forEach((item) => {
      if (!item.stale && item.node.nodeValue === item.written) item.node.nodeValue = item.final;
    });
    element.classList.remove(className);
    if (addedLabel) element.removeAttribute("aria-label");
    onDone?.();
  };
  requestAnimationFrame(tick);
}

const HOVER_SELECTOR = ".topbar-nav a:not(.brand), .footer-links a";

export function startHoverCipher(root = document.body) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return () => {};
  if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return () => {};

  const onOver = (event) => {
    const element = event.target instanceof Element ? event.target.closest(HOVER_SELECTOR) : null;
    if (!element || element.contains(event.relatedTarget)) return;
    if (element.classList.contains("is-ciphering") || element.classList.contains("is-scrambling")) return;
    element.style.width = `${element.getBoundingClientRect().width}px`;
    decryptElement(element, {
      duration: 420,
      className: "is-ciphering",
      onDone: () => element.style.removeProperty("width")
    });
  };

  root.addEventListener("pointerover", onOver, { passive: true });
  return () => root.removeEventListener("pointerover", onOver);
}

export function startHeadingDecrypt(root = document.body) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return () => {};
  if (window.matchMedia?.("(hover: none), (pointer: coarse)").matches) return () => {};

  const watched = new WeakSet();
  const timers = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const wait = Math.max(0, holdUntil - performance.now());
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          if (entry.target.isConnected) decryptElement(entry.target);
        }, wait);
        timers.add(timer);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
  );

  const scan = () => {
    root.querySelectorAll(HEADING_SELECTOR).forEach((element) => {
      if (watched.has(element) || element.closest(EXCLUDED)) return;
      watched.add(element);
      observer.observe(element);
    });
  };

  let frame = 0;
  const mutations = new MutationObserver(() => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    }
  });
  scan();
  mutations.observe(root, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mutations.disconnect();
    cancelAnimationFrame(frame);
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}
