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
import { Landmark, Share2, Search, Globe, Edit3, X, Menu, Linkedin, Github, Instagram, Mail } from "lucide-react";
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
import RouteCurtain from "./components/RouteCurtain";
import { holdDecrypt, startHeadingDecrypt, startHoverCipher } from "./decrypt";
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

function AnimatedBackgroundCanvas({ routeKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dust = [];
    let sparks = [];
    let lastSparkAt = 0;
    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.34,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.34,
      active: false,
    };

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

    const spawnSparks = (count) => {
      for (let index = 0; index < count; index += 1) {
        if (sparks.length > 90) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 1.6;
        sparks.push({
          x: pointer.x + (Math.random() - 0.5) * 8,
          y: pointer.y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          size: 0.8 + Math.random() * 1.8,
          spin: Math.random() * Math.PI,
        });
      }
    };

    const draw = (time = 0) => {
      const palette = getPalette();
      const seconds = time * 0.001;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      if (!reduceMotion) {
        pointer.x += (pointer.targetX - pointer.x) * 0.1;
        pointer.y += (pointer.targetY - pointer.y) * 0.1;
      }

      context.globalCompositeOperation = "lighter";

      dust.forEach((mote) => {
        if (!reduceMotion) {
          const dx = pointer.x - mote.x;
          const dy = pointer.y - mote.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 200 && distance > 0.001) {
            const pull = ((200 - distance) / 200) * 0.012;
            mote.vx += (dx / distance) * pull;
            mote.vy += (dy / distance) * pull;
          }
          mote.vx *= 0.985;
          mote.vy = mote.vy * 0.985 - 0.002;
          mote.x += mote.vx + Math.sin(seconds * 0.6 + mote.sway) * 0.12;
          mote.y += mote.vy;
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

      // Pointer sparks
      sparks = sparks.filter((spark) => spark.life > 0);
      sparks.forEach((spark) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.015;
        spark.vx *= 0.97;
        spark.life -= spark.decay;
        spark.spin += 0.1;

        // Crisp pixel sparks (squares and plus-signs), no glow
        context.save();
        context.translate(Math.round(spark.x), Math.round(spark.y));
        context.globalAlpha = Math.max(0, spark.life) * 0.95;
        const phase = spark.spin % Math.PI;
        context.fillStyle = phase > Math.PI * 0.5 ? palette.giltLight : palette.ultra;
        context.shadowBlur = 0;
        const size = Math.max(1, Math.round(spark.size * (0.6 + spark.life * 0.9)));
        if (phase > Math.PI * 0.75) {
          context.fillRect(-size * 2, -0.5, size * 4, 1);
          context.fillRect(-0.5, -size * 2, 1, size * 4);
        } else {
          context.fillRect(-size, -size, size * 2, size * 2);
        }
        context.restore();
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

    const updatePointer = (event) => {
      const point = event.touches?.[0] || event;
      if (typeof point?.clientX !== "number" || typeof point?.clientY !== "number") return;

      pointer.targetX = point.clientX;
      pointer.targetY = point.clientY;
      pointer.active = true;

      const now = performance.now();
      if (!reduceMotion && now - lastSparkAt > 28) {
        lastSparkAt = now;
        spawnSparks(2);
      }
    };

    const deactivatePointer = () => {
      pointer.active = false;
    };

    const burst = () => {
      if (!reduceMotion) spawnSparks(18);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("touchmove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    window.addEventListener("pointerleave", deactivatePointer, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("touchmove", updatePointer);
      window.removeEventListener("pointerdown", burst);
      window.removeEventListener("pointerleave", deactivatePointer);
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

    let frame = 0;
    let visible = false;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPosition = { x: target.x, y: target.y };
    const interactiveSelector = "a, button, [role='button'], input, textarea, select, label, summary";

    const place = (element, x, y) => {
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };

    const render = () => {
      ringPosition.x += (target.x - ringPosition.x) * 0.22;
      ringPosition.y += (target.y - ringPosition.y) * 0.22;
      place(ring, ringPosition.x, ringPosition.y);
      place(dot, target.x, target.y);
      place(burst, target.x, target.y);
      frame = requestAnimationFrame(render);
    };

    const move = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        ringPosition.x = target.x;
        ringPosition.y = target.y;
        place(ring, target.x, target.y);
        place(dot, target.x, target.y);
        place(burst, target.x, target.y);
        root.classList.remove("is-hidden");
      }
      const interactive = event.target?.closest?.(interactiveSelector);
      root.classList.toggle("is-hovering", Boolean(interactive));
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
    frame = requestAnimationFrame(render);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);

    return () => {
      cancelAnimationFrame(frame);
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
      <span className="lux-cursor-ring" ref={ringRef} />
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    if (wipeRef.current.count > 0) holdDecrypt(1050);
  }, [location.pathname]);
  useEffect(() => startHeadingDecrypt(document.body), []);
  useEffect(() => startHoverCipher(document.body), []);
  const [museumArt, setMuseumArt] = useState([]);
  const [artCycle, setArtCycle] = useState(0);
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

    const root = document.documentElement;
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

        root.style.setProperty("--px", (point.x / Math.max(1, window.innerWidth)).toFixed(3));
        root.style.setProperty("--py", (point.y / Math.max(1, window.innerHeight)).toFixed(3));

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
  const handleNavClick = () => setMobileNavOpen(false);

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
    artCycle && artPool.length ? artPool[(Math.max(0, artPool.indexOf(pageArt)) + artCycle) % artPool.length] : pageArt;
  const pageArtInfo =
    (museumEnabled && museumArt.find((item) => item.src === shownArt)) || houseArtInfo(shownArt, siteLabel(profile, "placardHouse"));
  const brandLetters = Array.from(siteLabel(profile, "brand"));

  return (
    <div className={`portfolio page-${routeKey} route-${subRouteKey}${placardShown ? " is-placard-shown" : ""}`}>
      <div className="page-motion-bg" aria-hidden="true">
        <ArtBackdrop src={shownArt} />
        <div className="page-art-light" />
        <div className="page-art-sheen" />
        <div className="page-art-wash" />
        <div className="page-art-spot" />
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
      />
      <div className="scroll-progress" aria-hidden="true">
        <i ref={progressRef} />
      </div>
      <GrandEntrance name={profile.name} tagline={siteLabel(profile, "entranceTagline")} />
      <LockOn />
      {wipeRef.current.count > 0 && (
        <RouteCurtain
          key={wipeRef.current.count}
          label={siteLabel(profile, ROUTE_LABELS[routeKey] || "navHome")}
          index={Math.max(0, Object.keys(ROUTE_LABELS).indexOf(routeKey))}
          total={Object.keys(ROUTE_LABELS).length}
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
          <div className={`nav-links${mobileNavOpen ? " is-open" : ""}`}>
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
              className="icon-button nav-icon"
              onClick={() => setLanguageOpen(true)}
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
              className="icon-button mobile-toggle"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      <main id="top">
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
        className={languageOpen ? "modal-backdrop" : "modal-backdrop is-hidden"}
        role="dialog"
        aria-modal="true"
        aria-hidden={!languageOpen}
        aria-label="Choose language"
        onClick={(e) => {
          if (e.target === e.currentTarget) setLanguageOpen(false);
        }}
      >
        <div className="language-modal">
          <div className="panel-title">
            <h2>{siteLabel(profile, "translateTitle")}</h2>
            <button
              className="icon-button"
              onClick={() => setLanguageOpen(false)}
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
