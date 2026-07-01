import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Github,
  ExternalLink,
  Mail,
  Newspaper,
  Award,
  Link as LinkIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Code2,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero-futuristic.png";
import { resolveMediaUrl } from "../utils";

function actualRecords(value) {
  return Array.isArray(value) ? value.filter((item) => item && item.id) : [];
}

const RandomNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState("00");

  useEffect(() => {
    let frame = 0;
    const maxFrames = 25;
    const timer = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(String(Math.floor(Math.random() * 99)).padStart(2, "0"));
      }
    }, 45);

    return () => clearInterval(timer);
  }, [value]);

  return <strong>{displayValue}</strong>;
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const SKETCHFAB_SERVER_ROOM_UID = "fe993fa15c254ee88677be6acec6b029";
const SKETCHFAB_VIEWER_API = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const SKETCHFAB_SERVER_ROOM_EMBED =
  "https://sketchfab.com/models/fe993fa15c254ee88677be6acec6b029/embed?autostart=1&autospin=0&transparent=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_hint=0&camera=0";

function loadSketchfabViewerApi() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);

  const existingScript = document.querySelector("script[data-sketchfab-viewer-api]");
  if (existingScript) {
    if (existingScript.dataset.loaded === "true" && !window.Sketchfab) {
      existingScript.remove();
      return loadSketchfabViewerApi();
    }

    return new Promise((resolve, reject) => {
      if (existingScript.dataset.loaded === "true" && window.Sketchfab) {
        resolve(window.Sketchfab);
        return;
      }
      existingScript.addEventListener("load", () => resolve(window.Sketchfab), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SKETCHFAB_VIEWER_API;
    script.async = true;
    script.dataset.sketchfabViewerApi = "true";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve(window.Sketchfab);
      },
      { once: true }
    );
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function interpolateVector(start, end, amount) {
  return start.map((value, index) => value + (end[index] - value) * amount);
}

function addVector(a, b) {
  return a.map((value, index) => value + b[index]);
}

function subtractVector(a, b) {
  return a.map((value, index) => value - b[index]);
}

function scaleVector(vector, amount) {
  return vector.map((value) => value * amount);
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function HeroCinematicBackdrop({ className = "hero-cinematic" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let targetScroll = 0;
    let smoothScroll = 0;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateScroll = () => {
      const section = canvas.closest(".hero-section");
      if (!section) {
        targetScroll = clamp(window.scrollY / Math.max(1, window.innerHeight * 2.35), 0, 1);
        return;
      }
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight * 0.22);
      targetScroll = clamp(-rect.top / travel, 0, 1);
    };

    const drawScene = (time) => {
      const t = (time - start) / 1000;
      smoothScroll += (targetScroll - smoothScroll) * 0.075;
      const p = smoothScroll;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#03050c");
      bg.addColorStop(0.42, "#07182b");
      bg.addColorStop(1, "#17071f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * (0.68 - p * 0.12), height * (0.48 + p * 0.12), 10, width * 0.66, height * 0.52, width * 0.58);
      glow.addColorStop(0, "rgba(101, 232, 255, 0.34)");
      glow.addColorStop(0.38, "rgba(255, 111, 216, 0.12)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const horizon = height * (0.55 - p * 0.1);
      const vanishingX = width * (0.63 + Math.sin(t * 0.15) * 0.05);
      ctx.lineWidth = 1;
      for (let i = -18; i <= 18; i++) {
        const x = width * 0.5 + i * width * 0.055;
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizon);
        ctx.lineTo(x, height);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(101, 232, 255, 0.18)" : "rgba(101, 232, 255, 0.08)";
        ctx.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const y = horizon + Math.pow(i / 17, 1.9) * (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = i % 4 === 0 ? "rgba(255, 159, 67, 0.12)" : "rgba(145, 255, 207, 0.06)";
        ctx.stroke();
      }

      const orbitX = width * (0.66 - p * 0.05);
      const orbitY = height * (0.45 + p * 0.08);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(orbitX, orbitY, 160 + i * 48 + p * 60, 54 + i * 18, Math.sin(t * 0.16 + i) * 0.25, 0, Math.PI * 2);
        ctx.strokeStyle = i === 1 ? "rgba(255, 159, 67, 0.25)" : "rgba(101, 232, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 24; i++) {
        const x = width * (0.44 + ((i * 97) % 420) / 1000) + Math.sin(t * 0.34 + i) * 24;
        const y = height * (0.16 + ((i * 53) % 620) / 1000) + Math.cos(t * 0.28 + i) * 18 + p * 80;
        const radius = 1.4 + ((i * 11) % 4);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? "rgba(255, 159, 67, 0.52)" : "rgba(101, 232, 255, 0.36)";
        ctx.fill();
      }

      if (!media.matches) {
        frameId = requestAnimationFrame(drawScene);
      }
    };

    resize();
    updateScroll();
    drawScene(performance.now());

    const animate = () => {
      updateScroll();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", animate, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", animate);
    };
  }, []);

  return <canvas className={className} ref={canvasRef} aria-hidden="true" />;
}

function HomeServerRoomModel() {
  const roomRef = useRef(null);
  const frameRef = useRef(null);
  const apiRef = useRef(null);
  const baseCameraRef = useRef(null);
  const baseFovRef = useRef(54);
  const lastCameraStateRef = useRef({ progress: -1, sway: -1, lift: -1 });

  useEffect(() => {
    const room = roomRef.current;
    const frame = frameRef.current;
    if (!room || !frame) return undefined;

    let frameId = 0;
    let cancelled = false;
    let readyFallbackId = 0;

    const syncViewerToScroll = (progress, time = performance.now()) => {
      const api = apiRef.current;
      const baseCamera = baseCameraRef.current;
      if (!api || !baseCamera) return;

      const roundedProgress = Math.round(progress * 100) / 100;
      const sway = Math.sin(time * 0.00082 + roundedProgress * Math.PI * 2.7) * 1.85;
      const lift = Math.cos(time * 0.00062 + roundedProgress * Math.PI * 2.1) * 0.62;
      const lookAhead = Math.sin(time * 0.00038 + roundedProgress * Math.PI * 3.4) * 0.42;
      if (
        Math.abs(roundedProgress - lastCameraStateRef.current.progress) < 0.015 &&
        Math.abs(sway - lastCameraStateRef.current.sway) < 0.028 &&
        Math.abs(lift - lastCameraStateRef.current.lift) < 0.018
      ) {
        return;
      }
      lastCameraStateRef.current = { progress: roundedProgress, sway, lift };

      const forward = normalizeVector(subtractVector(baseCamera.target, baseCamera.position));
      const right = normalizeVector([forward[2], 0, -forward[0]]);
      const up = [0, 1, 0];
      const eased = roundedProgress * roundedProgress * (3 - 2 * roundedProgress);
      const push = scaleVector(forward, eased * 3.15);
      const lateralEye = scaleVector(right, sway);
      const lateralTarget = scaleVector(right, sway * -0.58 + lookAhead);
      const verticalEye = scaleVector(up, lift + eased * 0.26);
      const verticalTarget = scaleVector(up, lift * -0.92 - eased * 0.5);
      const targetPush = scaleVector(forward, eased * 1.18);
      const eye = addVector(addVector(addVector(baseCamera.position, push), lateralEye), verticalEye);
      const target = addVector(addVector(addVector(baseCamera.target, targetPush), lateralTarget), verticalTarget);
      const fov = clamp(baseFovRef.current - eased * 19, 30, 58);

      api.setCameraLookAt(eye, target, 0.12);
      api.setFov(fov);
    };

    const update = () => {
      const progress = clamp(window.scrollY / Math.max(1, window.innerHeight * 2.5), 0, 1);
      const cssSway = Math.sin(progress * Math.PI * 2.6);
      const cssLift = Math.cos(progress * Math.PI * 2.1);
      room.style.setProperty("--room-progress", progress.toFixed(3));
      room.style.setProperty("--room-sway", cssSway.toFixed(3));
      room.style.setProperty("--room-lift", cssLift.toFixed(3));
      syncViewerToScroll(progress);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    loadSketchfabViewerApi()
      .then((Sketchfab) => {
        if (cancelled || !Sketchfab) return;

        const client = new Sketchfab("1.12.1", frame);
        client.init(SKETCHFAB_SERVER_ROOM_UID, {
          autostart: 1,
          preload: 1,
          transparent: 1,
          autospin: 0,
          ui_controls: 0,
          ui_infos: 0,
          ui_inspector: 0,
          ui_settings: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
          ui_hint: 0,
          camera: 0,
          success(api) {
            if (cancelled) return;
            apiRef.current = api;
            api.start();
            api.addEventListener("viewerready", () => {
              if (cancelled) return;

              room.classList.add("is-ready");
              api.setUserInteraction(false);
              api.setCameraEasing("easeLinear");
              api.getFov((fovError, fov) => {
                if (!fovError && typeof fov === "number") baseFovRef.current = clamp(fov, 44, 58);
              });
              api.getCameraLookAt((cameraError, camera) => {
                if (!cameraError && camera?.position && camera?.target) {
                  baseCameraRef.current = {
                    position: camera.position,
                    target: camera.target,
                  };
                  syncViewerToScroll(clamp(window.scrollY / Math.max(1, window.innerHeight * 2.5), 0, 1));
                }
              });
            });
          },
          error() {
            room.classList.add("is-fallback", "is-ready");
          },
        });
      })
      .catch(() => {
        if (!cancelled) room.classList.add("is-fallback", "is-ready");
      });

    readyFallbackId = window.setTimeout(() => {
      if (!cancelled) room.classList.add("is-ready");
    }, 6500);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(readyFallbackId);
      apiRef.current = null;
      baseCameraRef.current = null;
    };
  }, []);

  return (
    <div className="home-server-room" ref={roomRef} aria-hidden="true">
      <iframe
        ref={frameRef}
        title="Decorative 3D server room"
        src={SKETCHFAB_SERVER_ROOM_EMBED}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        tabIndex="-1"
      />
    </div>
  );
}

export default function Home({ content, language }) {
  const { profile, experiences, certificates, projects, posts } = content;

  const safeExperiences = actualRecords(experiences);
  const safeCerts = actualRecords(certificates);
  const safeProjects = actualRecords(projects);
  const safePosts = actualRecords(posts);
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [activeProject, setActiveProject] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const previewDelay = 4200;

  const typingPhrases = useMemo(
    () => {
      if (profile.roles && profile.roles.length > 0) {
        return [profile.role, ...profile.roles];
      }
      return [
        profile.role,
        "Real-time AI systems builder",
        "Full-stack web application developer",
        "Computer vision and data science creator",
      ];
    },
    [profile.role, profile.roles]
  );

  const featuredProjects = useMemo(
    () =>
      [...safeProjects]
        .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999))
        .slice(0, 5),
    [safeProjects]
  );

  const activeProjectData = featuredProjects[activeProject % Math.max(featuredProjects.length, 1)];
  const nextProjectData = featuredProjects.length > 1
    ? featuredProjects[(activeProject + 1) % featuredProjects.length]
    : null;

  useEffect(() => {
    const phrase = typingPhrases[typingIndex % typingPhrases.length] || "";

    if (typedText.length < phrase.length) {
      const timer = setTimeout(() => {
        setTypedText(phrase.slice(0, typedText.length + 1));
      }, 42);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setTypedText("");
      setTypingIndex((index) => (index + 1) % typingPhrases.length);
    }, 1500);
    return () => clearTimeout(timer);
  }, [typedText, typingIndex, typingPhrases]);

  useEffect(() => {
    if (featuredProjects.length < 2 || isPreviewPaused) return undefined;
    const timer = setTimeout(() => {
      setActiveProject((index) => (index + 1) % featuredProjects.length);
    }, previewDelay);
    return () => clearTimeout(timer);
  }, [activeProject, featuredProjects.length, isPreviewPaused]);

  const changeProject = (direction) => {
    if (!featuredProjects.length) return;
    setActiveProject((index) => (index + direction + featuredProjects.length) % featuredProjects.length);
  };

  const stats = [
    { label: "Projects", value: String(safeProjects.length).padStart(2, "0") },
    { label: "Experience", value: String(safeExperiences.length).padStart(2, "0") },
    { label: "Certificates", value: String(safeCerts.length).padStart(2, "0") }
  ];

  const latestPosts = useMemo(
    () =>
      [...safePosts]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3),
    [safePosts]
  );

  const internalLinks = [
    { label: "Projects", to: "/projects", icon: <Github size={18} /> },
    { label: "Certificates", to: "/certificates", icon: <Award size={18} /> },
    { label: "Academic Path", to: "/about", icon: <GraduationCap size={18} /> },
    { label: "Experience", to: "/about", icon: <BriefcaseBusiness size={18} /> },
    { label: "Blog", to: "/blog", icon: <Mail size={18} /> }
  ];

  const externalLinks = [
    { label: "GitHub", href: profile.github, icon: <ExternalLink size={18} /> }
  ];

  return (
    <div className="home-cinematic-page">
      <HeroCinematicBackdrop className="home-cinematic-background" />
      <HomeServerRoomModel />
      <section className="hero-section">
        <img className="hero-image" src={heroImage} alt="Futuristic holographic developer workspace" />
        <div className="hero-overlay" />
        <div className="hero-content reveal is-visible">
          <div className="hero-identity">
            {profile.avatar && <img className="profile-avatar" src={resolveMediaUrl(profile.avatar)} alt="" />}
            <div>
              <div className="eyebrow">
                <Sparkles size={16} />
                {profile.location}
              </div>
              <p className="hero-status">Part-time at IT CITY Public Company Limited</p>
            </div>
          </div>
          <p className="hero-greeting">
            {language === "th"
              ? "สวัสดี ผม Jirathiwat"
              : language === "zh-CN"
              ? "你好，我是 Jirathiwat"
              : "Hello, I am Jirathiwat"}
          </p>
          <h1>{profile.name}</h1>
          <p className="hero-role typing-line" aria-label={profile.role}>
            <span>{typedText || " "}</span>
            <i aria-hidden="true" />
          </p>
          <p className="hero-copy">{profile.headline}</p>
          <div className="hero-actions">
            {/* Use Link to navigate to /about#contact section */}
            <Link className="primary-button" to="/about">
              Contact
              <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button" to="/blog">
              Latest news
            </Link>
          </div>
        </div>
        <div className="signal-panel reveal is-visible">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <RandomNumber value={stat.value} />
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {activeProjectData && (
        <section
          className="section project-showcase-section reveal"
          onMouseEnter={() => setIsPreviewPaused(true)}
          onMouseLeave={() => setIsPreviewPaused(false)}
          onFocus={() => setIsPreviewPaused(true)}
          onBlur={() => setIsPreviewPaused(false)}
        >
          <div className="section-kicker">
            <Rocket size={18} />
            Interactive Preview
          </div>
          <div className="section-heading">
            <h2>{profile.headings?.homeProjectsTitle || "Featured Projects"}</h2>
            <p className="section-note">{profile.headings?.homeProjectsDesc || "A showcase of my recent work in software engineering, AI, and full-stack development."}</p>
          </div>

          <div className={isPreviewPaused ? "project-autoplay is-paused" : "project-autoplay"}>
            <span
              key={activeProject}
              style={{ "--preview-delay": `${previewDelay}ms` }}
            />
          </div>

          <div className="project-showcase">
            <div className="project-preview-column">
              <Link className="project-preview-stage" to={`/projects/${activeProjectData.id}`}>
                {activeProjectData.imageUrl && (
                  <img src={resolveMediaUrl(activeProjectData.imageUrl)} alt={activeProjectData.name} />
                )}
                <div className="project-scanline" />
                <div className="project-preview-badge">
                  <Code2 size={16} />
                  {activeProjectData.language || "Project"}
                </div>
              </Link>

              <div className="project-stepper" aria-label="Project stream control">
                <div>
                  <span>
                    {String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
                  </span>
                  <strong>{nextProjectData ? `Next: ${nextProjectData.name}` : activeProjectData.name}</strong>
                </div>
                {nextProjectData && (
                  <button className="icon-button" onClick={() => changeProject(1)} aria-label="Move to next project">
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="project-preview-copy">
              <span className="project-count">
                {String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
              </span>
              <h3>{activeProjectData.name}</h3>
              <p>{activeProjectData.description}</p>
              <div className="project-highlights mini">
                {(activeProjectData.highlights || []).slice(0, 3).map((highlight) => (
                  <span key={highlight}>{highlight}</span>
                ))}
              </div>
              <div className="project-slider-actions">
                <button className="icon-button" onClick={() => changeProject(-1)} aria-label="Previous project">
                  <ChevronLeft size={18} />
                </button>
                <button className="icon-button" onClick={() => changeProject(1)} aria-label="Next project">
                  <ChevronRight size={18} />
                </button>
                <Link className="primary-button" to={`/projects/${activeProjectData.id}`}>
                  View case
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section className="section home-blog-section reveal">
          <div className="section-kicker">
            <Newspaper size={18} />
            Latest Blog
          </div>
          <div className="section-heading">
            <h2>{profile.headings?.blogTitle || "Latest posts"}</h2>
            <p className="section-note">{profile.headings?.blogDesc || "Thoughts, news, and technical articles."}</p>
          </div>
          <div className="home-post-grid">
            {latestPosts.map((post) => (
              <Link className="home-post-card" key={post.id} to={`/blog/${post.id}`}>
                {post.imageUrl && (
                  <img src={resolveMediaUrl(post.imageUrl)} alt="" loading="lazy" />
                )}
                <div className="home-post-copy">
                  <div className="post-meta">
                    <span>{post.category || "Post"}</span>
                    <span>
                      <CalendarDays size={14} />
                      {post.date || "Recent"}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <span className="read-more-link">
                    Read post
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section quick-section reveal">
        <div className="section-kicker">
          <LinkIcon size={18} />
          Explore
        </div>
        <div className="section-heading">
          <h2>{profile.headings?.homeUpdatesTitle || "Quick shortcuts"}</h2>
          <p className="section-note">{profile.headings?.homeUpdatesDesc || "Jump directly into the parts of the portfolio people usually want first."}</p>
        </div>
        <div className="quick-grid">
          {internalLinks.map((link) => (
            <Link className="quick-card" key={link.label} to={link.to}>
              {link.icon}
              <span>{link.label}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
          {externalLinks.map((link) => (
            <a className="quick-card" key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.icon}
              <span>{link.label}</span>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
