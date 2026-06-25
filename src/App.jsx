import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Zap, Share2, Search, Globe, Edit3, X, Menu, Linkedin, Github, Instagram, Mail } from "lucide-react";
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
const scrambleCharacters = "01ABCDEF#$_/\\|<>[]{}:";
const hashCharacters = "0123456789abcdef";

function getRandomCharacter(index) {
  if (index % 5 === 0) return "#";
  if (index % 7 === 0) return "$";
  return scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
}

function getHashCharacter() {
  return hashCharacters[Math.floor(Math.random() * hashCharacters.length)];
}

function scrambleTextElement(element) {
  if (!element || element.dataset.scrambling === "true") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const finalText = element.dataset.scrambleText || element.textContent || "";
  if (!finalText.trim()) return;

  element.dataset.scrambleText = finalText;
  element.dataset.scrambling = "true";
  element.classList.remove("scramble-complete");
  element.classList.add("is-scrambling");

  let frame = 0;
  const maxFrames = Math.max(22, Math.min(48, finalText.length * 1.45));
  const hashFrames = 5;

  const timer = window.setInterval(() => {
    const progress = Math.max(0, (frame - hashFrames) / (maxFrames - hashFrames));
    const settledCount = Math.floor(finalText.length * progress);

    element.textContent = Array.from(finalText)
      .map((character, index) => {
        if (character === " " || index < settledCount) return character;
        if (frame < hashFrames) return getHashCharacter();
        return getRandomCharacter(index);
      })
      .join("");

    frame += 1;
    if (frame > maxFrames) {
      window.clearInterval(timer);
      element.textContent = finalText;
      element.dataset.scrambling = "false";
      element.classList.remove("is-scrambling");
      element.classList.add("scramble-complete");
    }
  }, 28);
}

function runScramble(root) {
  const targets = root.matches?.("h1, h2, .project-count")
    ? [root]
    : Array.from(root.querySelectorAll("h1, h2, .project-count"));

  targets.forEach((target) => scrambleTextElement(target));
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
    let dpr = 1;
    let particles = [];

    const getPalette = () => {
      const source = document.querySelector(".portfolio") || document.documentElement;
      const styles = window.getComputedStyle(source);
      return {
        accent: styles.getPropertyValue("--page-accent").trim() || "#65e8ff",
        accentTwo: styles.getPropertyValue("--page-accent-2").trim() || "#91ffcf",
        accentThree: styles.getPropertyValue("--page-accent-3").trim() || "#ff6fd8",
      };
    };

    const alphaColor = (color, alpha) => {
      const hex = color.trim().replace("#", "");
      if (/^[0-9a-f]{3}$/i.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return color;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(110, Math.max(46, Math.floor((width * height) / 18000)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: 0.7 + Math.random() * 1.6,
        pulse: Math.random() * Math.PI * 2,
        colorIndex: index % 3,
      }));

    };

    const draw = (time = 0) => {
      const palette = getPalette();
      const seconds = time * 0.001;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";

      const backgroundSweep = context.createLinearGradient(0, 0, width, height);
      backgroundSweep.addColorStop(0, alphaColor(palette.accentThree, 0.1));
      backgroundSweep.addColorStop(0.48, "rgba(5, 8, 18, 0.02)");
      backgroundSweep.addColorStop(1, alphaColor(palette.accent, 0.1));
      context.fillStyle = backgroundSweep;
      context.fillRect(0, 0, width, height);

      const drawNebula = (x, y, radius, color, alpha) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, alphaColor(color, alpha));
        gradient.addColorStop(0.4, alphaColor(color, alpha * 0.32));
        gradient.addColorStop(1, alphaColor(color, 0));
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      };

      context.globalCompositeOperation = "lighter";
      drawNebula(
        width * (0.18 + Math.sin(seconds * 0.12) * 0.035),
        height * (0.18 + Math.cos(seconds * 0.11) * 0.025),
        Math.max(width, height) * 0.46,
        palette.accentThree,
        0.18
      );
      drawNebula(
        width * (0.82 + Math.cos(seconds * 0.1) * 0.03),
        height * (0.3 + Math.sin(seconds * 0.13) * 0.03),
        Math.max(width, height) * 0.42,
        palette.accent,
        0.16
      );
      drawNebula(
        width * 0.52,
        height * (0.85 + Math.sin(seconds * 0.09) * 0.04),
        Math.max(width, height) * 0.38,
        palette.accentTwo,
        0.1
      );

      const laneColors = [palette.accent, palette.accentTwo, palette.accentThree];
      const drawPerspectiveGrid = () => {
        const horizon = height * 0.55;
        const vanishingX = width * 0.52 + Math.sin(seconds * 0.16) * width * 0.04;
        const floorBottom = height + 80;
        const floorTop = horizon - 24;
        const columns = 18;
        const rows = 16;

        context.save();
        context.beginPath();
        context.rect(0, horizon - 40, width, height - horizon + 120);
        context.clip();
        context.globalCompositeOperation = "lighter";
        context.shadowBlur = 10;
        context.shadowColor = palette.accentTwo;

        for (let index = -columns; index <= columns; index += 1) {
          const bottomX = width * 0.5 + index * (width / columns) * 0.68;
          context.globalAlpha = 0.17;
          context.strokeStyle = alphaColor(index % 2 === 0 ? palette.accentTwo : palette.accent, 0.95);
          context.lineWidth = index === 0 ? 1.35 : 0.75;
          context.beginPath();
          context.moveTo(vanishingX, floorTop);
          context.lineTo(bottomX, floorBottom);
          context.stroke();
        }

        for (let row = 1; row <= rows; row += 1) {
          const progress = row / rows;
          const eased = progress * progress;
          const y = floorTop + eased * (floorBottom - floorTop);
          const halfWidth = (width * 0.06) + eased * width * 0.76;
          const wave = Math.sin(seconds * 1.4 + row * 0.55) * 3;
          context.globalAlpha = 0.08 + progress * 0.18;
          context.strokeStyle = alphaColor(row % 2 === 0 ? palette.accent : palette.accentTwo, 0.95);
          context.lineWidth = row % 4 === 0 ? 1.2 : 0.7;
          context.beginPath();
          context.moveTo(vanishingX - halfWidth, y + wave);
          context.lineTo(vanishingX + halfWidth, y - wave);
          context.stroke();
        }

        context.shadowBlur = 0;
        context.restore();
      };

      drawPerspectiveGrid();

      for (let index = 0; index < 11; index += 1) {
        const laneY = ((index + 1) / 9) * height;
        const drift = ((seconds * (26 + index * 4)) + index * 170) % (width + 540);
        const startX = drift - 340;
        const startY = laneY + Math.sin(seconds * 0.5 + index) * 42;
        context.globalAlpha = 0.18;
        context.strokeStyle = laneColors[index % laneColors.length];
        context.lineWidth = index % 3 === 0 ? 1.45 : 0.85;
        context.shadowBlur = 16;
        context.shadowColor = laneColors[index % laneColors.length];
        context.beginPath();
        context.moveTo(startX, startY);
        context.bezierCurveTo(startX + 140, startY - 105, startX + 270, startY + 75, startX + 470, startY - 24);
        context.stroke();
      }
      context.shadowBlur = 0;

      for (let ring = 0; ring < 4; ring += 1) {
        const x = width * (0.22 + ring * 0.18) + Math.sin(seconds * 0.2 + ring) * 24;
        const y = height * (0.18 + (ring % 2) * 0.48) + Math.cos(seconds * 0.16 + ring) * 18;
        const radius = 42 + ring * 16 + Math.sin(seconds * 0.7 + ring) * 8;
        context.globalAlpha = 0.16;
        context.strokeStyle = laneColors[(ring + 1) % laneColors.length];
        context.lineWidth = 1;
        context.beginPath();
        context.arc(x, y, radius, seconds * 0.28, seconds * 0.28 + Math.PI * 1.35);
        context.stroke();
      }

      particles.forEach((particle) => {
        if (!reduceMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -20) particle.x = width + 20;
          if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          if (particle.y > height + 20) particle.y = -20;
        }
      });

      for (let a = 0; a < particles.length; a += 1) {
        for (let b = a + 1; b < particles.length; b += 1) {
          const first = particles[a];
          const second = particles[b];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 128) continue;

          context.globalAlpha = (1 - distance / 128) * 0.24;
          context.strokeStyle = a % 2 === 0 ? palette.accent : palette.accentTwo;
          context.lineWidth = 0.85;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }

      particles.forEach((particle) => {
        const color = particle.colorIndex === 0 ? palette.accent : particle.colorIndex === 1 ? palette.accentTwo : palette.accentThree;
        const pulse = reduceMotion ? 0.8 : 0.62 + Math.sin(seconds * 1.8 + particle.pulse) * 0.3;
        context.globalAlpha = Math.max(0.24, pulse);
        context.fillStyle = color;
        context.shadowBlur = 10;
        context.shadowColor = color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";

      if (!reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    if (!reduceMotion) frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [routeKey]);

  return <canvas className="motion-canvas" ref={canvasRef} />;
}

function App() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let frame = 0;

    const updatePointer = (event) => {
      const point = event.touches?.[0] || event;
      if (typeof point?.clientX !== "number" || typeof point?.clientY !== "number") return;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--pointer-x", `${point.clientX}px`);
        document.documentElement.style.setProperty("--pointer-y", `${point.clientY}px`);
      });
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("touchmove", updatePointer, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("touchmove", updatePointer);
    };
  }, []);

  useEffect(() => {
    const cardSelector = [
      ".quick-card",
      ".project-card",
      ".certificate-card",
      ".post-card",
      ".timeline-item",
      ".education-card",
      ".skill-card",
      ".editor-panel",
      ".about-profile-card",
      ".about-metric",
    ].join(",");

    const updateCardGlow = (event) => {
      const card = event.target.closest?.(cardSelector);
      if (!card) return;

      const rect = card.getBoundingClientRect();
      card.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
    };

    window.addEventListener("pointermove", updateCardGlow, { passive: true });
    return () => window.removeEventListener("pointermove", updateCardGlow);
  }, []);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      const target = document.getElementById("google_translate_element");
      if (!target || target.dataset.ready === "true" || !window.google?.translate) return;

      target.dataset.ready = "true";
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
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

  // Re-run reveal animation whenever the route changes
  useEffect(() => {
    // Scroll to top on page change
    window.scrollTo(0, 0);

    // Give React a frame to render the new page's DOM
    const timer = setTimeout(() => {
      const reveals = document.querySelectorAll(".reveal");
      if (!reveals.length) return;

      const revealElement = (element) => {
        element.classList.add("is-visible");
        runScramble(element);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealElement(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );

      reveals.forEach((el) => {
        el.classList.remove("is-visible"); // reset for re-entry
        observer.observe(el);

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08) {
          revealElement(el);
          observer.unobserve(el);
        }
      });

      return () => observer.disconnect();
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const fetchContent = async () => {
    if (isStaticSite) {
      setContent(staticContent);
      setError(null);
      setCanEdit(false);
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
      setContent(staticContent);
      setError(null);
      setCanEdit(false);
    }

    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => setCanEdit(data.canEdit === true))
      .catch(() => setCanEdit(false));
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
        <Zap size={32} color="var(--pink)" />
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
        <Zap size={32} className="pulse-icon" color="var(--cyan)" />
        <p>Initializing...</p>
      </div>
    );
  }

  const { profile } = content;
  const routeKey = location.pathname.split("/").filter(Boolean)[0] || "home";

  return (
    <div className={`portfolio page-${routeKey}`}>
      <div className="page-motion-bg" aria-hidden="true">
        <AnimatedBackgroundCanvas routeKey={routeKey} />
      </div>

      <header className="topbar">
        <nav className="topbar-nav">
          {/* Logo / Brand */}
          <Link className="brand" to="/" aria-label="Jirathiwat home" onClick={handleNavClick}>
            <Zap size={24} className="brand-icon" />
            <strong>Jirathiwat</strong>
          </Link>

          {/* Desktop + mobile-dropdown links */}
          <div className={`nav-links${mobileNavOpen ? " is-open" : ""}`}>
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>Home</NavLink>
            <NavLink to="/projects" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>Projects</NavLink>
            <NavLink to="/certificates" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>Certificates</NavLink>
            <NavLink to="/skills" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>Skills</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>About</NavLink>
            <NavLink to="/blog" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>Blog</NavLink>
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
            {!isStaticSite && (
              <Link className="ghost-button nav-admin" to="/admin" onClick={handleNavClick}>
                <Edit3 size={16} />
                Admin
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
                onRefresh={fetchContent}
                onNavigate={(path) => navigate(path)}
              />
            }
          />
          {/* Catch-all → home */}
          <Route path="*" element={<Home content={content} language={language} />} />
        </Routes>

        <footer className="site-footer">
          <div>
            <Link className="brand" to="/" aria-label="Jirathiwat home">
              <Zap size={28} color="var(--cyan)" />
              <strong>Jirathiwat</strong>
            </Link>
            <p>Software Engineer, AI &amp; Full-Stack Developer in Bangkok City, Thailand.</p>
          </div>
          <div className="footer-links">
            <Link to="/projects">Projects</Link>
            <Link to="/certificates">Certificates</Link>
            <Link to="/skills">Skills</Link>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} /></a>
            {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
            {profile.email && <a href={`mailto:${profile.email}`} aria-label="Email"><Mail size={18} /></a>}
          </div>
          <button
            className="ghost-button"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <Share2 size={16} />
            Copy Link
          </button>
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
            <h2>Translate website</h2>
            <button
              className="icon-button"
              onClick={() => setLanguageOpen(false)}
              aria-label="Close language chooser"
            >
              <X size={18} />
            </button>
          </div>
          <p>Pick a language to automatically translate this page.</p>
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
            <p>Powered by Google Translate</p>
          </div>
        </div>
      </div>

      <div className="google-translate-host" aria-hidden="true">
        <div id="google_translate_element" />
      </div>
    </div>

  );
}

export default App;
