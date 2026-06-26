import { useState, useEffect, useRef } from "react";
import { Code2, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, Github, Linkedin, Instagram, Mail } from "lucide-react";
import { normalizeList, resolveMediaUrl } from "../utils";

const ABOUT_RACK_UID = "f178ec0a9c5f4605a5acbaaeb52dc721";
const SKETCHFAB_VIEWER_API = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const ABOUT_RACK_EMBED =
  "https://sketchfab.com/models/f178ec0a9c5f4605a5acbaaeb52dc721/embed?autostart=1&autospin=0&transparent=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_hint=0&camera=0";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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

function AboutRackBackdrop() {
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const apiRef = useRef(null);
  const baseCameraRef = useRef(null);
  const baseFovRef = useRef(52);
  const lastStateRef = useRef({ progress: -1, sway: -1, lift: -1 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    if (!wrap || !frame) return undefined;

    let frameId = 0;
    let readyFallbackId = 0;
    let cancelled = false;

    const syncCamera = (progress, time = performance.now()) => {
      const api = apiRef.current;
      const baseCamera = baseCameraRef.current;
      if (!api || !baseCamera) return;

      const roundedProgress = Math.round(progress * 100) / 100;
      const sway = Math.sin(time * 0.0007 + roundedProgress * Math.PI * 2.5) * 1.45;
      const lift = Math.cos(time * 0.00055 + roundedProgress * Math.PI * 2.15) * 0.52;
      if (
        Math.abs(roundedProgress - lastStateRef.current.progress) < 0.015 &&
        Math.abs(sway - lastStateRef.current.sway) < 0.025 &&
        Math.abs(lift - lastStateRef.current.lift) < 0.018
      ) {
        return;
      }
      lastStateRef.current = { progress: roundedProgress, sway, lift };

      const forward = normalizeVector(subtractVector(baseCamera.target, baseCamera.position));
      const right = normalizeVector([forward[2], 0, -forward[0]]);
      const up = [0, 1, 0];
      const eased = roundedProgress * roundedProgress * (3 - 2 * roundedProgress);
      const eye = addVector(
        addVector(
          addVector(baseCamera.position, scaleVector(forward, eased * 2.1)),
          scaleVector(right, sway)
        ),
        scaleVector(up, lift + eased * 0.18)
      );
      const target = addVector(
        addVector(
          addVector(baseCamera.target, scaleVector(forward, eased * 0.72)),
          scaleVector(right, sway * -0.45)
        ),
        scaleVector(up, lift * -0.72 - eased * 0.28)
      );
      const fov = clamp(baseFovRef.current - eased * 12, 34, 56);

      api.setCameraLookAt(eye, target, 0.14);
      api.setFov(fov);
    };

    const update = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      wrap.style.setProperty("--about-rack-progress", progress.toFixed(3));
      wrap.style.setProperty("--about-rack-sway", Math.sin(progress * Math.PI * 2.35).toFixed(3));
      wrap.style.setProperty("--about-rack-lift", Math.cos(progress * Math.PI * 2.05).toFixed(3));
      syncCamera(progress);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    loadSketchfabViewerApi()
      .then((Sketchfab) => {
        if (cancelled || !Sketchfab) return;

        const client = new Sketchfab("1.12.1", frame);
        client.init(ABOUT_RACK_UID, {
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

              wrap.classList.add("is-ready");
              api.setUserInteraction(false);
              api.setCameraEasing("easeLinear");
              api.getFov((fovError, fov) => {
                if (!fovError && typeof fov === "number") baseFovRef.current = clamp(fov, 44, 56);
              });
              api.getCameraLookAt((cameraError, camera) => {
                if (!cameraError && camera?.position && camera?.target) {
                  baseCameraRef.current = {
                    position: camera.position,
                    target: camera.target,
                  };
                  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
                  syncCamera(clamp(window.scrollY / maxScroll, 0, 1));
                }
              });
            });
          },
          error() {
            wrap.classList.add("is-fallback", "is-ready");
          },
        });
      })
      .catch(() => {
        if (!cancelled) wrap.classList.add("is-fallback", "is-ready");
      });

    readyFallbackId = window.setTimeout(() => {
      if (!cancelled) wrap.classList.add("is-ready");
    }, 4200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(readyFallbackId);
      apiRef.current = null;
      baseCameraRef.current = null;
    };
  }, []);

  return (
    <div className="about-rack-backdrop" ref={wrapRef} aria-hidden="true">
      <iframe
        ref={frameRef}
        title="Decorative 3D data center rack"
        src={ABOUT_RACK_EMBED}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        tabIndex="-1"
      />
    </div>
  );
}

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState("00");
  
  useEffect(() => {
    const targetStr = String(value).padStart(2, "0");
    let frame = 0;
    const maxFrames = 40; // ~600ms of random numbers
    
    const timer = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        setDisplayValue(targetStr);
        clearInterval(timer);
      } else {
        // Generate random 2-digit number
        const randomNum = Math.floor(Math.random() * 99);
        setDisplayValue(String(randomNum).padStart(2, "0"));
      }
    }, 30);
    
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
}

export default function About({ content }) {
  const { profile, experiences, education = [] } = content;
  const skills = normalizeList(profile.skills);
  const aboutStats = [
    { value: experiences.length, label: "Experience" },
    { value: education.length, label: "Academic" },
    { value: skills.length, label: "Core skills" },
  ];

  return (
    <div className="about-cinematic-page">
      <AboutRackBackdrop />
      <div className="page-content">
      <section className="section about-section reveal">
        <div className="about-grid">
          <div className="about-copy">
            <div className="section-kicker">
              <Code2 size={18} />
              Profile
            </div>
            <h2>{profile.aboutTitle || "Software engineer building AI systems, full-stack products, and practical digital solutions."}</h2>
            <p>{profile.bio}</p>
          </div>

          <aside className="about-profile-card" aria-label="Jirathiwat profile summary">
            <div className="about-portrait-wrap">
              {profile.avatar && (
                <img className="about-portrait" src={resolveMediaUrl(profile.avatar)} alt={profile.name} />
              )}
              <span className="about-orbit about-orbit-one" />
              <span className="about-orbit about-orbit-two" />
            </div>
            <div className="about-profile-body">
              <span className="about-status">
                <Sparkles size={15} />
                Available for software engineering work
              </span>
              <h3>{profile.name}</h3>
              <p>{profile.role}</p>
              <div className="about-meta">
                <span>
                  <MapPin size={15} />
                  {profile.location}
                </span>
                <span>
                  <BriefcaseBusiness size={15} />
                  IT CITY Public Company Limited
                </span>
              </div>
              <div className="about-card-links">
                {profile.email && (
                  <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Email">
                    <Mail size={17} />
                  </a>
                )}
                {profile.github && (
                  <a className="icon-link" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                    <Github size={17} />
                  </a>
                )}
                {profile.linkedin && (
                  <a className="icon-link" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin size={17} />
                  </a>
                )}
                {profile.instagram && (
                  <a className="icon-link" href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram size={17} />
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="about-metrics">
          {aboutStats.map((stat) => (
            <div className="about-metric" key={stat.label}>
              <strong><AnimatedNumber value={stat.value} /></strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="skill-cloud">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <section className="section timeline-section reveal" id="experience">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <BriefcaseBusiness size={18} />
              Experience
            </div>
            <h2>{profile.headings?.aboutExperienceTitle || "Work history"}</h2>
          </div>
        </div>
        <div className="timeline">
          {experiences.map((experience) => (
            <article className="timeline-item" key={experience.id}>
              <div className="timeline-dot" />
              <div>
                <span>{experience.period}</span>
                <h3>{experience.role}</h3>
                <p className="company">{experience.company}</p>
                <p>{experience.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section education-section reveal" id="education">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <GraduationCap size={18} />
              Education
            </div>
            <h2>{profile.headings?.aboutEducationTitle || "Academic path"}</h2>
          </div>
        </div>
        <div className="education-grid">
          {education.map((item) => (
            <article className="education-card" key={item.id}>
              <span>{item.period}</span>
              <h3>{item.school}</h3>
              <p className="company">{item.program}</p>
              <p>{item.description}</p>
              {normalizeList(item.skills).length > 0 && (
                <div className="mini-skill-cloud">
                  {normalizeList(item.skills).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
