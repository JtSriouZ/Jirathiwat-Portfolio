import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import {
  ART_ROUTE_COUNT,
  createVisitArtMap,
  fetchMuseumArt,
  getArtRouteKey,
  keepLandscapeArt,
  localEuropeanArt,
  preloadEuropeanArt
} from "./europeanArt";
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Landmark, Share2, Search, Globe, Edit3, X, Linkedin, Github, Instagram, Mail, Frame, Keyboard } from "lucide-react";
import Home from "./pages/Home";
import About from "./pages/About";
import Skills from "./pages/Skills";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Certificates from "./pages/Certificates";
import CertificateDetail from "./pages/CertificateDetail";
import Blog from "./pages/Blog";
import PostDetail from "./pages/PostDetail";
import Admin from "./pages/Admin";
import { triggerGoogleTranslate } from "./utils";
import { siteLabel } from "./siteCopy";
import AtelierSound from "./components/AtelierSound";
import GrandEntrance from "./components/GrandEntrance";
import Ornament from "./components/Ornament";
import ArtPlacard from "./components/ArtPlacard";
import ArtBackdrop from "./components/ArtBackdrop";
import LockOn from "./components/LockOn";
import GalleryMode from "./components/GalleryMode";
import Codex from "./components/Codex";
import RouteCurtain, { CURTAIN_MS } from "./components/RouteCurtain";
import { holdDecrypt, startHeadingDecrypt, startHoverCipher } from "./decrypt";
import { startClickSeal, startGalleryLantern, startInfraredLens } from "./interactions";
import staticContent from "../data/content.json";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "th", label: "Thai" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
];

const isStaticSite = import.meta.env.VITE_STATIC_SITE === "true";
const ART_SLIDE_MS = 20000;
const ART_POOL_LIMIT = 40;
// Classical glyphs: Greek capitals and Roman numerals settle into the final text.
const ROUTE_LABELS = {
  home: "navHome",
  projects: "navProjects",
  certificates: "navCertificates",
  skills: "navSkills",
  about: "navAbout",
  blog: "navBlog",
  admin: "navAdmin",
};
const KEY_ROUTES = { 1: "/", 2: "/projects", 3: "/certificates", 4: "/skills", 5: "/about", 6: "/blog" };

function houseArtInfo(src, houseLabel) {
  const name = String(src || "").match(/\/ornament\/european-([a-z-]+)\.\w+$/)?.[1];
  if (!name) return null;
  const [artist, museum] = String(houseLabel || "").split("·").map((part) => part.trim());
  return {
    title: name.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    artist,
    museum,
  };
}

const FRAME_INTERVAL = 1000 / 30 - 2;

const isLiteDevice = () => {
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  return cores <= 4 || memory <= 4 || navigator.connection?.saveData === true;
};

if (typeof document !== "undefined" && isLiteDevice()) {
  document.documentElement.classList.add("is-lite");
}

function AnimatedBackgroundCanvas({ routeKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("is-lite");
    let frame = 0;
    let width = 0;
    let height = 0;
    let dust = [];

    const getPalette = () => {
      return {
        accent: "#2416f2",
        accentTwo: "#b7c0ff",
        accentThree: "#2416f2",
        gilt: "#2416f2",
        giltLight: "#b7c0ff",
        champagne: "#b7c0ff",
        ultra: "#2416f2",
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(1, 0, 0, 1, 0, 0);

      const count = Math.min(28, Math.max(12, Math.floor((width * height) / 70000)));
      dust = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.16 - Math.random() * 0.34,
        size: 0.6 + Math.random() * 1.9,
        sway: Math.random() * Math.PI * 2,
        twinkle: Math.random() * Math.PI * 2,
        tone: index % 4,
      }));
    };

    let lastDrawAt = 0;
    const draw = (time = 0) => {
      if (!reduceMotion && time - lastDrawAt < FRAME_INTERVAL) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const step = lastDrawAt ? Math.min(3, (time - lastDrawAt) / 16.67) : 1;
      lastDrawAt = time;
      const palette = getPalette();
      const seconds = time * 0.001;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      const damping = 0.985 ** step;

      context.globalCompositeOperation = "lighter";

      dust.forEach((mote) => {
        if (!reduceMotion) {
          mote.vx *= damping;
          mote.vy = mote.vy * damping - 0.002 * step;
          mote.x += (mote.vx + Math.sin(seconds * 0.6 + mote.sway) * 0.12) * step;
          mote.y += mote.vy * step;
          if (mote.x < -20) mote.x = width + 20;
          if (mote.x > width + 20) mote.x = -20;
          if (mote.y < -20) {
            mote.y = height + 20;
            mote.x = Math.random() * width;
          }
          if (mote.y > height + 20) mote.y = -20;
        }

        const tone = mote.tone % 2 === 0 ? palette.giltLight : palette.accent;
        const twinkle = reduceMotion ? 0.45 : 0.42 + Math.sin(seconds * 1.6 + mote.twinkle) * 0.38;
        context.globalAlpha = Math.max(0.08, twinkle);
        context.fillStyle = tone;
        context.beginPath();
        context.arc(mote.x, mote.y, mote.size * 0.55, 0, Math.PI * 2);
        context.fill();
      });

      context.shadowBlur = 0;
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      if (!reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [routeKey]);

  return <canvas className="motion-canvas" ref={canvasRef} />;
}

function GildedCursor() {
  const rootRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const burstRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const burst = burstRef.current;
    if (!root || !ring || !dot || !burst) return undefined;
    if (window.matchMedia?.("(hover: none), (pointer: coarse)").matches) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    let visible = false;
    const interactiveSelector = "a, button, [role='button'], input, textarea, select, label, summary";
    const textSelector = "input, textarea, select, [contenteditable='true']";

    const place = (element, x, y) => {
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };

    const move = (event) => {
      place(ring, event.clientX, event.clientY);
      place(dot, event.clientX, event.clientY);
      place(burst, event.clientX, event.clientY);
      if (!visible) {
        visible = true;
        root.classList.remove("is-hidden");
      }
      const interactive = event.target?.closest?.(interactiveSelector);
      const typing = event.target?.closest?.(textSelector);
      root.classList.toggle("is-hovering", Boolean(interactive) && !typing);
      root.classList.toggle("is-text", Boolean(typing));
    };

    const hide = () => {
      visible = false;
      root.classList.add("is-hidden");
    };

    const press = () => {
      root.classList.add("is-pressed");
      burst.classList.remove("is-burst");
      void burst.offsetWidth;
      burst.classList.add("is-burst");
    };
    const release = () => root.classList.remove("is-pressed");

    root.classList.add("is-hidden");
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      document.documentElement.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <div className="lux-cursor is-hidden" ref={rootRef} aria-hidden="true">
      <span className="lux-cursor-burst" ref={burstRef}><i /></span>
      <span className="lux-cursor-ring" ref={ringRef}>
        <b /><b /><b /><b />
      </span>
      <span className="lux-cursor-dot" ref={dotRef} />
    </div>
  );
}

function App() {
  const [content, setContent] = useState(
    isStaticSite || !import.meta.env.DEV ? (staticContent.default || staticContent) : null
  );
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageClosing, setLanguageClosing] = useState(false);
  const languageCloseRef = useRef(0);
  const languageClosingRef = useRef(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavClosing, setMobileNavClosing] = useState(false);
  const mobileCloseRef = useRef(0);
  const mobileClosingRef = useRef(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [placardShown, setPlacardShown] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();
  const location = useLocation();
  const artSeedRef = useRef(`${Date.now()}-${Math.random()}`);
  const shownArtRef = useRef({ key: "", routes: {} });
  const progressRef = useRef(null);
  const wipeRef = useRef({ path: location.pathname, count: 0 });
  if (wipeRef.current.path !== location.pathname) {
    wipeRef.current = { path: location.pathname, count: wipeRef.current.count + 1 };
  }
  useLayoutEffect(() => {
    if (wipeRef.current.count > 0) holdDecrypt(CURTAIN_MS);
  }, [location.pathname]);
  useEffect(() => startHeadingDecrypt(document.body), []);
  useEffect(() => startHoverCipher(document.body), []);
  useEffect(() => startInfraredLens(document), []);
  useEffect(() => startClickSeal(document), []);
  useEffect(() => {
    if (!content) return undefined;
    return startGalleryLantern();
  }, [content]);
  const [museumArt, setMuseumArt] = useState([]);
  const [artCycle, setArtCycle] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const museumEnabled = !isStaticSite && Boolean(content) && content.profile?.museumBackgrounds !== false;
  const backgroundKey = (content?.profile?.backgrounds || []).join("|");
  const museumKey = museumEnabled ? museumArt.map((item) => item.src).join("|") : "";
  const artMap = useMemo(() => {
    if (shownArtRef.current.key !== backgroundKey) {
      shownArtRef.current = { key: backgroundKey, routes: {} };
    }
    const next = createVisitArtMap(
      artSeedRef.current,
      content?.profile?.backgrounds,
      museumEnabled ? museumArt.map((item) => item.src) : []
    );
    return { ...next, ...shownArtRef.current.routes };
  }, [backgroundKey, museumKey]);

  useEffect(() => {
    preloadEuropeanArt(content?.profile?.backgrounds);
  }, [backgroundKey]);

  useEffect(() => {
    if (!museumEnabled) return undefined;
    let cancelled = false;
    fetchMuseumArt()
      .then((items) => keepLandscapeArt(items))
      .then((kept) => {
        if (cancelled || kept.length >= ART_ROUTE_COUNT) return kept;
        return fetchMuseumArt()
          .then((items) => keepLandscapeArt(items, ART_ROUTE_COUNT - kept.length))
          .then((more) => [...kept, ...more.filter((item) => !kept.some((known) => known.src === item.src))])
          .catch(() => kept);
      })
      .then((kept) => {
        if (!cancelled && kept.length) setMuseumArt(kept);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [museumEnabled]);

  const artPool = useMemo(() => {
    const museum = museumEnabled ? museumArt.map((item) => item.src) : [];
    return museum.length ? museum : localEuropeanArt(content?.profile?.backgrounds);
  }, [museumKey, backgroundKey]);

  useEffect(() => {
    setArtCycle(0);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setArtCycle((cycle) => cycle + 1);
    }, ART_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return undefined;
    const onKey = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      const { key } = event;
      if (key === "Escape") {
        setGalleryOpen(false);
        setCodexOpen(false);
      } else if (key === "?") {
        setCodexOpen((open) => !open);
      } else if (key === "g" || key === "G") {
        setCodexOpen(false);
        setGalleryOpen((open) => !open);
      } else if (key === "m" || key === "M") {
        window.dispatchEvent(new Event("atelier:sound-toggle"));
      } else if (galleryOpen && (key === "ArrowRight" || key === "ArrowLeft")) {
        event.preventDefault();
        setArtCycle((cycle) => cycle + (key === "ArrowRight" ? 1 : -1));
      } else if (KEY_ROUTES[key]) {
        setGalleryOpen(false);
        setCodexOpen(false);
        navigate(KEY_ROUTES[key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, location.pathname, navigate]);

  useEffect(() => {
    if (!museumEnabled || !artCycle || artCycle % 5 || museumArt.length >= ART_POOL_LIMIT) return undefined;
    let cancelled = false;
    fetchMuseumArt()
      .then((items) => keepLandscapeArt(items, 6))
      .then((more) => {
        if (cancelled || !more.length) return;
        setMuseumArt((current) => [
          ...current,
          ...more.filter((item) => !current.some((known) => known.src === item.src)),
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [artCycle]);

  useEffect(() => {
    const cardSelector = [
      ".hero-seal",
      ".quick-card",
      ".project-card",
      ".certificate-card",
      ".post-card",
      ".home-post-card",
      ".timeline-item",
      ".education-card",
      ".skill-card",
      ".feature-card",
      ".persona-card",
      ".editor-panel",
      ".about-profile-card",
      ".about-metric",
      ".project-preview-stage",
    ].join(",");

    let tiltedCard = null;
    let magnet = null;
    let pointerFrame = 0;
    let pointer = null;
    const magnetSelector = [
      ".primary-button",
      ".secondary-button",
      ".ghost-button",
      ".nav-links a",
      ".icon-link",
      ".icon-button",
      ".skill-cloud span",
      ".about-metric",
      ".footer-links a",
      ".still-controls button",
      ".still-controls a",
    ].join(",");

    const clearMagnet = (element) => {
      if (!element) return;
      element.style.setProperty("--mag-x", "0px");
      element.style.setProperty("--mag-y", "0px");
    };

    const resetTilt = (card) => {
      if (!card) return;
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };

    const updateCardGlow = (event) => {
      pointer = {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
        pointerType: event.pointerType,
      };
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        const point = pointer;
        if (!point) return;

        // Scoped to the backdrop: setting these on :root restyles the whole document.
        const backdrop = document.querySelector(".page-motion-bg");
        if (backdrop) {
          backdrop.style.setProperty("--px", (point.x / Math.max(1, window.innerWidth)).toFixed(3));
          backdrop.style.setProperty("--py", (point.y / Math.max(1, window.innerHeight)).toFixed(3));
        }

        const nextMagnet = point.target?.closest?.(magnetSelector);
        if (nextMagnet !== magnet) {
          clearMagnet(magnet);
          magnet = nextMagnet;
        }
        if (magnet && point.pointerType !== "touch") {
          const magnetRect = magnet.getBoundingClientRect();
          const dx = point.x - (magnetRect.left + magnetRect.width / 2);
          const dy = point.y - (magnetRect.top + magnetRect.height / 2);
          const pull = (delta) => Math.max(-7, Math.min(7, delta * 0.18));
          magnet.style.setProperty("--mag-x", `${pull(dx).toFixed(1)}px`);
          magnet.style.setProperty("--mag-y", `${pull(dy).toFixed(1)}px`);
        }

        const card = point.target?.closest?.(cardSelector);
        if (card !== tiltedCard) {
          resetTilt(tiltedCard);
          tiltedCard = card;
        }
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const localX = point.x - rect.left;
        const localY = point.y - rect.top;
        card.style.setProperty("--card-x", `${localX}px`);
        card.style.setProperty("--card-y", `${localY}px`);

        const ratioX = localX / Math.max(1, rect.width) - 0.5;
        const ratioY = localY / Math.max(1, rect.height) - 0.5;
        const maxTilt = rect.width > 520 ? 3.5 : 6;
        card.style.setProperty("--tilt-x", `${(-ratioY * maxTilt).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(ratioX * maxTilt).toFixed(2)}deg`);
      });
    };

    const clearTilt = () => {
      resetTilt(tiltedCard);
      tiltedCard = null;
      clearMagnet(magnet);
      magnet = null;
    };

    window.addEventListener("pointermove", updateCardGlow, { passive: true });
    window.addEventListener("pointerleave", clearTilt, { passive: true });
    document.addEventListener("scroll", clearTilt, { passive: true });
    return () => {
      window.cancelAnimationFrame(pointerFrame);
      window.removeEventListener("pointermove", updateCardGlow);
      window.removeEventListener("pointerleave", clearTilt);
      document.removeEventListener("scroll", clearTilt);
    };
  }, []);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      const target = document.getElementById("google_translate_element");
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!target || target.dataset.ready === "true" || typeof TranslateElement !== "function") return;

      target.dataset.ready = "true";
      try {
        new TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
            layout: TranslateElement.InlineLayout?.SIMPLE || 1,
          },
          "google_translate_element"
        );
      } catch (err) {
        target.dataset.ready = "false";
        console.warn("Google Translate widget failed to initialize", err);
      }
    };

    const existingScript = document.querySelector('script[src*="translate_a/element.js"]');
    if (existingScript) {
      window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setNavScrolled(window.scrollY > 28);
        const range = document.documentElement.scrollHeight - window.innerHeight;
        setPlacardShown(range < 80 || window.scrollY > Math.min(window.innerHeight * 0.45, range * 0.5));
        if (progressRef.current) {
          const progress = range > 0 ? Math.min(1, window.scrollY / range) : 0;
          progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
        }
      });
    };
    onScroll();
    const settle = window.setTimeout(onScroll, 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname, content]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    let observer;
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-offscreen", !entry.isIntersecting)),
        { rootMargin: "120px 0px" }
      );
      document.querySelectorAll(".hero-editorial, .editorial-marquee, .site-footer").forEach((el) => observer.observe(el));
    }, 150);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [location.pathname, content]);

  // Replay reveal animation whenever sections re-enter the viewport.
  useEffect(() => {
    let observer;
    // Scroll to top on page change
    window.scrollTo(0, 0);

    // Give React a frame to render the new page's DOM
    const timer = setTimeout(() => {
      const reveals = document.querySelectorAll(".reveal");
      const revealCardSelector = [
        ".quick-card",
        ".home-post-card",
        ".project-card",
        ".certificate-card",
        ".post-card",
        ".timeline-item",
        ".education-card",
        ".skill-card",
        ".feature-card",
        ".persona-card",
        ".still-plate",
        ".skill-group",
        ".project-stepper",
      ].join(",");
      const revealCards = document.querySelectorAll(revealCardSelector);
      if (!reveals.length && !revealCards.length) return;

      const revealElement = (element) => {
        element.classList.add("is-visible");
      };

      const resetElement = (element) => {
        if (element.classList.contains("is-visible")) {
          element.classList.remove("is-visible");
          element.classList.add("is-reveal-reset");
        }
      };

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!entry.target.classList.contains("is-visible")) {
                entry.target.classList.remove("is-reveal-reset");
                revealElement(entry.target);
              }
            } else if (entry.intersectionRatio === 0) {
              resetElement(entry.target);
            }
          });
        },
        {
          threshold: [0, 0.12, 0.28],
          rootMargin: "0px 0px -7% 0px",
        }
      );

      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!entry.target.classList.contains("is-card-visible")) {
                entry.target.classList.remove("is-card-reset");
                entry.target.classList.add("is-card-visible");
              }
            } else if (entry.intersectionRatio === 0) {
              entry.target.classList.remove("is-card-visible");
              entry.target.classList.add("is-card-reset");
            }
          });
        },
        {
          threshold: [0, 0.18, 0.36],
          rootMargin: "0px 0px -10% 0px",
        }
      );

      reveals.forEach((el) => {
        el.classList.remove("is-visible"); // reset for re-entry
        el.classList.add("is-reveal-reset");
        observer.observe(el);

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08) {
          el.classList.remove("is-reveal-reset");
          revealElement(el);
        }
      });

      revealCards.forEach((card) => {
        card.classList.remove("is-card-visible");
        card.classList.add("is-card-reset");
        cardObserver.observe(card);

        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.12) {
          card.classList.remove("is-card-reset");
          card.classList.add("is-card-visible");
        }
      });

      observer.cardObserver = cardObserver;
    }, 50);

    return () => {
      clearTimeout(timer);
      observer?.cardObserver?.disconnect();
      observer?.disconnect();
    };
  }, [location.pathname]);

  const fetchContent = async () => {
    if (isStaticSite) {
      setContent(staticContent.default || staticContent);
      setError(null);
      setCanEdit(false);
      setCanPublish(false);
      return;
    }

    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setContent(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch content:", err);
      setContent(staticContent.default || staticContent);
      setError(null);
      setCanEdit(false);
      setCanPublish(false);
    }

    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setCanEdit(data.canEdit === true);
        setCanPublish(data.canPublish === true || (data.runtime === "local" && data.canEdit === true));
      })
      .catch(() => {
        setCanEdit(false);
        setCanPublish(false);
      });
  };

  useEffect(() => {
    fetchContent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile nav when route changes
  const openMobileNav = () => {
    window.clearTimeout(mobileCloseRef.current);
    mobileClosingRef.current = false;
    setMobileNavClosing(false);
    setMobileNavOpen(true);
  };

  const closeMobileNav = () => {
    if (!mobileNavOpen || mobileClosingRef.current) return;
    mobileClosingRef.current = true;
    setMobileNavClosing(true);
    window.clearTimeout(mobileCloseRef.current);
    mobileCloseRef.current = window.setTimeout(() => {
      mobileClosingRef.current = false;
      setMobileNavOpen(false);
      setMobileNavClosing(false);
    }, 700);
  };

  const handleNavClick = () => closeMobileNav();

  const openLanguage = () => {
    window.clearTimeout(languageCloseRef.current);
    languageClosingRef.current = false;
    setLanguageClosing(false);
    setLanguageOpen(true);
  };

  const closeLanguage = () => {
    if (!languageOpen || languageClosingRef.current) return;
    languageClosingRef.current = true;
    setLanguageClosing(true);
    window.clearTimeout(languageCloseRef.current);
    languageCloseRef.current = window.setTimeout(() => {
      languageClosingRef.current = false;
      setLanguageOpen(false);
      setLanguageClosing(false);
    }, 1000);
  };

  const chooseLanguage = useCallback((code) => {
    setLanguage(code);
    setLanguageOpen(false);

    if (code === "en") {
      // Clear Google Translate cookie and reload to restore original
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
      window.location.reload();
      return;
    }

    // Trigger local Google Translate widget
    triggerGoogleTranslate(code);
  }, []);

  if (error) {
    return (
      <div className="loading-screen">
        <div className="lux-monogram" aria-hidden="true">J</div>
        <p style={{ textAlign: "center", maxWidth: 480 }}>{error}</p>
        <button className="primary-button" onClick={fetchContent}>
          Retry
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="loading-screen">
        <div className="lux-monogram" aria-hidden="true">J</div>
        <p>Unveiling the collection</p>
      </div>
    );
  }

  const { profile } = content;
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeKey = pathParts[0] || "home";
  const subRouteKey = pathParts.join("-") || "home";
  const artRouteKey = getArtRouteKey(location.pathname);
  const pageArt = artMap[artRouteKey] || artMap.home;
  if (!museumEnabled || museumArt.length) shownArtRef.current.routes[artRouteKey] = pageArt;
  const shownArt =
    artCycle && artPool.length
      ? artPool[(((Math.max(0, artPool.indexOf(pageArt)) + artCycle) % artPool.length) + artPool.length) % artPool.length]
      : pageArt;
  const pageArtInfo =
    (museumEnabled && museumArt.find((item) => item.src === shownArt)) || houseArtInfo(shownArt, siteLabel(profile, "placardHouse"));
  const brandLetters = Array.from(siteLabel(profile, "brand"));

  return (
    <div
      className={`portfolio page-${routeKey} route-${subRouteKey}${placardShown ? " is-placard-shown" : ""}${galleryOpen ? " is-gallery" : ""}`}
    >
      <div className="page-motion-bg" aria-hidden="true">
        <ArtBackdrop src={shownArt} />
        <div className="page-art-light" />
        <div className="page-art-sheen" />
        <div className="page-art-wash" />
        <div className="page-art-spot" />
        <div className="page-art-lantern" aria-hidden="true" />
        <AnimatedBackgroundCanvas routeKey={routeKey} />
      </div>
      <GildedCursor />
      <div className="film-grain" aria-hidden="true" />
      <div className="gallery-rail is-left" aria-hidden="true">
        <span>{siteLabel(profile, "railMotto")}</span>
      </div>
      <div className="gallery-rail is-right" aria-hidden="true">
        <span>{siteLabel(profile, "footerStatus")}</span>
      </div>
      <ArtPlacard
        key={shownArt}
        art={pageArtInfo}
        index={Math.max(0, artPool.indexOf(shownArt))}
        label={siteLabel(profile, "placardLabel")}
        sourceLabel={siteLabel(profile, "placardSource")}
        openLabel={siteLabel(profile, "galleryOpen")}
        onOpen={() => setGalleryOpen(true)}
      />
      <GalleryMode
        open={galleryOpen}
        art={pageArtInfo}
        index={Math.max(0, artPool.indexOf(shownArt))}
        total={artPool.length}
        profile={profile}
        onPrev={() => setArtCycle((cycle) => cycle - 1)}
        onNext={() => setArtCycle((cycle) => cycle + 1)}
        onClose={() => setGalleryOpen(false)}
      />
      <Codex open={codexOpen} profile={profile} onClose={() => setCodexOpen(false)} />
      <div className="scroll-progress" aria-hidden="true">
        <i ref={progressRef} />
      </div>
      <GrandEntrance name={profile.name} tagline={siteLabel(profile, "entranceTagline")} paintings={artPool} />
      <LockOn />
      {wipeRef.current.count > 0 && (
        <RouteCurtain
          key={wipeRef.current.count}
          label={siteLabel(profile, ROUTE_LABELS[routeKey] || "navHome")}
          index={Math.max(0, Object.keys(ROUTE_LABELS).indexOf(routeKey))}
          total={Object.keys(ROUTE_LABELS).length}
          paintings={artPool}
        />
      )}

      <header className={`topbar${navScrolled ? " is-scrolled" : ""}`}>
        <nav className="topbar-nav">
          {/* Logo / Brand */}
          <Link className="brand" to="/" aria-label={`${siteLabel(profile, "brand")} home`} onClick={handleNavClick}>
            <Landmark size={22} className="brand-icon" />
            <strong>{siteLabel(profile, "brand")}</strong>
          </Link>

          {/* Desktop + mobile-dropdown links */}
          <div className={`nav-links${mobileNavOpen ? " is-open" : ""}${mobileNavClosing ? " is-closing" : ""}`}>
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navHome")}</NavLink>
            <NavLink to="/projects" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navProjects")}</NavLink>
            <NavLink to="/certificates" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navCertificates")}</NavLink>
            <NavLink to="/skills" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navSkills")}</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navAbout")}</NavLink>
            <NavLink to="/blog" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>{siteLabel(profile, "navBlog")}</NavLink>
          </div>

          {/* Right-side actions */}
          <div className="nav-actions">
            <Link className="icon-link nav-icon" to="/projects" aria-label="Find projects" onClick={handleNavClick}>
              <Search size={18} />
            </Link>
            <button
              className="icon-button nav-icon nav-gallery"
              onClick={() => setGalleryOpen(true)}
              aria-label={siteLabel(profile, "galleryOpen")}
              title={`${siteLabel(profile, "galleryOpen")} (G)`}
            >
              <Frame size={18} />
            </button>
            <button
              className="icon-button nav-icon nav-codex"
              onClick={() => setCodexOpen(true)}
              aria-label={siteLabel(profile, "codexTitle")}
              title={`${siteLabel(profile, "codexTitle")} (?)`}
            >
              <Keyboard size={18} />
            </button>
            <button
              className="icon-button nav-icon"
              onClick={openLanguage}
              aria-label="Choose language"
            >
              <Globe size={18} />
            </button>
            {import.meta.env.DEV && !isStaticSite && (
              <Link className="ghost-button nav-admin" to="/admin" onClick={handleNavClick}>
                <Edit3 size={16} />
                {siteLabel(profile, "navAdmin")}
              </Link>
            )}
            {/* Hamburger — mobile only */}
            <button
              className={`icon-button mobile-toggle${mobileNavOpen && !mobileNavClosing ? " is-open" : ""}`}
              onClick={() => (mobileNavOpen && !mobileNavClosing ? closeMobileNav() : openMobileNav())}
              aria-label={mobileNavOpen && !mobileNavClosing ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen && !mobileNavClosing}
            >
              <span className="mobile-toggle-bars" aria-hidden="true">
                <i /><i /><i />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main id="top" inert={galleryOpen}>
        <Routes>
          <Route path="/" element={<Home content={content} language={language} />} />
          <Route path="/projects" element={<Projects content={content} />} />
          <Route path="/projects/:id" element={<ProjectDetail content={content} />} />
          <Route path="/certificates" element={<Certificates content={content} />} />
          <Route path="/certificates/:id" element={<CertificateDetail content={content} />} />
          <Route path="/skills" element={<Skills content={content} />} />
          <Route path="/about" element={<About content={content} />} />
          <Route path="/blog" element={<Blog content={content} />} />
          <Route path="/blog/:id" element={<PostDetail content={content} />} />
          <Route
            path="/admin"
            element={
              <Admin
                content={content}
                canEdit={canEdit}
                canPublish={canPublish}
                onRefresh={fetchContent}
                onNavigate={(path) => navigate(path)}
              />
            }
          />
          {/* Catch-all → home */}
          <Route path="*" element={<Home content={content} language={language} />} />
        </Routes>

        <Ornament className="is-footer" />
        <footer className="site-footer">
          <span className="footer-orbit footer-orbit-one" aria-hidden="true" />
          <span className="footer-orbit footer-orbit-two" aria-hidden="true" />
          <span className="footer-scanline" aria-hidden="true" />
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label={`${siteLabel(profile, "brand")} home`}>
              <Landmark size={26} className="brand-icon" />
              <strong>{siteLabel(profile, "brand")}</strong>
            </Link>
            <p>{siteLabel(profile, "footerBlurb")}</p>
            <div className="footer-signal" aria-label={siteLabel(profile, "footerStatus")}>
              <span />
              {siteLabel(profile, "footerStatus")}
            </div>
          </div>
          <div className="footer-section">
            <h2>{siteLabel(profile, "footerExplore")}</h2>
            <div className="footer-links">
              <Link to="/projects">{siteLabel(profile, "navProjects")}</Link>
              <Link to="/certificates">{siteLabel(profile, "navCertificates")}</Link>
              <Link to="/skills">{siteLabel(profile, "navSkills")}</Link>
              <Link to="/about">{siteLabel(profile, "navAbout")}</Link>
              <Link to="/blog">{siteLabel(profile, "navBlog")}</Link>
            </div>
          </div>
          <div className="footer-actions">
            <div className="footer-section">
              <h2>{siteLabel(profile, "footerConnect")}</h2>
              <div className="footer-socials">
                <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
                <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} /></a>
                {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
                {profile.email && <a href={`mailto:${profile.email}`} aria-label="Email"><Mail size={18} /></a>}
              </div>
            </div>
            <div className="footer-section footer-action">
              <h2>{siteLabel(profile, "footerShare")}</h2>
              <button
                className="ghost-button"
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
              >
                <Share2 size={16} />
                {siteLabel(profile, "copyLink")}
              </button>
            </div>
          </div>
          <div className="footer-wordmark" aria-hidden="true">
            <span style={{ "--n": brandLetters.length }}>
              {brandLetters.map((letter, index) => (
                <i key={index} style={{ "--i": index }}>
                  {letter}
                </i>
              ))}
            </span>
          </div>
        </footer>
      </main>

      {/* Language modal */}
      <div
        className={`modal-backdrop${!languageOpen && !languageClosing ? " is-hidden" : ""}${languageClosing ? " is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!languageOpen && !languageClosing}
        aria-label="Choose language"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLanguage();
        }}
      >
        <div className="language-modal">
          <div className="panel-title">
            <h2>{siteLabel(profile, "translateTitle")}</h2>
            <button
              className="icon-button"
              onClick={closeLanguage}
              aria-label="Close language chooser"
            >
              <X size={18} />
            </button>
          </div>
          <p>{siteLabel(profile, "translateNote")}</p>
          <div className="language-options">
            {languageOptions.map(({ code, label }) => (
              <button
                key={code}
                className={language === code ? "primary-button" : "secondary-button"}
                onClick={() => chooseLanguage(code)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="translator-status">
            <Globe size={14} />
            <p>{siteLabel(profile, "translateCredit")}</p>
          </div>
        </div>
      </div>

      <div className="google-translate-host" aria-hidden="true">
        <div id="google_translate_element" />
      </div>
      <AtelierSound profile={profile} />
    </div>

  );
}

export default App;
