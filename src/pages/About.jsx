import { useState, useEffect, useRef } from "react";
import { Code2, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, Github, Linkedin, Instagram, Mail } from "lucide-react";
import { normalizeList } from "../utils";
import StillGrid from "../components/StillGrid";
import ArtFrame from "../components/ArtFrame";
import PortraitReel, { hasPortrait } from "../components/PortraitReel";
import { siteLabel } from "../siteCopy";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mountRack(THREE, wrap, canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07060f, 0.02);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const rack = new THREE.Group();
  const lamps = new THREE.Group();
  rack.add(lamps);
  scene.add(rack);

  /* Obsidian cabinet, ultramarine lamps — same palette as the rest of the site. */
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1640, roughness: 0.36, metalness: 0.82, emissive: 0x2416f2, emissiveIntensity: 0.1 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x100c28, roughness: 0.48, metalness: 0.7, emissive: 0x100c72, emissiveIntensity: 0.08 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x161230, roughness: 0.42, metalness: 0.64, emissive: 0x1b12a0, emissiveIntensity: 0.07 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x241c58, roughness: 0.28, metalness: 0.84, emissive: 0x2416f2, emissiveIntensity: 0.12 });
  const lampOn = new THREE.MeshBasicMaterial({ color: 0x2416f2 });
  const lampSoft = new THREE.MeshBasicMaterial({ color: 0x6d7bff });
  const lampIvory = new THREE.MeshBasicMaterial({ color: 0xb7c0ff });
  const edge = new THREE.MeshBasicMaterial({ color: 0xb7c0ff, transparent: true, opacity: 0.72 });
  const lampMats = [lampOn, lampSoft, lampIvory];

  const addBox = (name, size, pos, mat, parent = rack) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    m.name = name; m.position.set(...pos); parent.add(m); return m;
  };

  /* Cabinet: one register of vents, then an even row of blades. */
  addBox("shell", [1.86, 4.72, 0.92], [0, 0, 0], darkMetal);
  addBox("l-rail", [0.08, 4.96, 1.02], [-0.97, 0, 0], metal);
  addBox("r-rail", [0.08, 4.96, 1.02], [0.97, 0, 0], metal);
  addBox("top", [2.04, 0.1, 1.02], [0, 2.48, 0], metal);
  addBox("bot", [2.04, 0.12, 1.02], [0, -2.48, 0], metal);
  addBox("l-edge", [0.012, 4.55, 0.012], [-1.01, 0, 0.51], edge);
  addBox("r-edge", [0.012, 4.55, 0.012], [1.01, 0, 0.51], edge);

  for (let r = 0; r < 4; r++) {
    addBox(`vent-${r}`, [1.38, 0.016, 0.016], [0, 1.98 - r * 0.1, 0.48],
      new THREE.MeshBasicMaterial({ color: 0xb7c0ff, transparent: true, opacity: 0.2 }));
  }

  for (let i = 0; i < 8; i++) {
    const y = 1.22 - i * 0.4;
    addBox(`bl-${i}`, [1.5, 0.2, 0.14], [0, y, 0.4], bladeMat);
    addBox(`hd-${i}`, [0.14, 0.06, 0.02], [-0.56, y, 0.49], trimMat);
    for (let j = 0; j < 3; j++) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.024, 0.01), lampMats[(i + j) % 3]);
      lamp.position.set(0.26 + j * 0.14, y + 0.01, 0.49);
      lamp.userData = { pulse: i * 0.55 + j };
      lamps.add(lamp);
    }
  }

  scene.add(new THREE.AmbientLight(0x1a1460, 0.62));
  const key = new THREE.DirectionalLight(0xb7c0ff, 1.55);
  key.position.set(2.4, 3.2, 4.4);
  scene.add(key);
  const rim = new THREE.PointLight(0x2416f2, 3.2, 10);
  rim.position.set(-1.8, 0.8, 2.6);
  scene.add(rim);

  let frameId = 0;
  let width = 0;
  let height = 0;

  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const animate = (time = 0) => {
    frameId = requestAnimationFrame(animate);
    if (document.hidden || time - lastRender < 40) return;
    lastRender = time;
    const sec = time * 0.001;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    const sway = Math.sin(progress * Math.PI * 2.35);
    const placeX = width < 860 ? 3.1 : 3.7;

    rack.position.set(placeX, -0.05, 0);
    rack.rotation.y = -0.34 + sway * 0.03;
    rack.rotation.x = 0.02;
    rack.rotation.z = 0;

    lamps.children.forEach((ch) => {
      if (ch.userData.pulse !== undefined) {
        const glow = 0.72 + Math.sin(sec * 1.1 + ch.userData.pulse) * 0.12;
        ch.material.opacity = glow;
        ch.material.transparent = true;
      }
    });

    camera.position.set(0, 0.1, 12.4);
    camera.lookAt(0, -0.05, 0);

    const fadeIn = String(Math.round(clamp(0.78 + progress * 0.22, 0, 1) * 100) / 100);
    if (canvas.style.opacity !== fadeIn) canvas.style.opacity = fadeIn;

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      wrap.classList.add("is-ready");
    }
  };

  let ready = false;

  let lastRender = 0;

  resize();
  frameId = requestAnimationFrame(animate);
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    renderer.dispose();
    scene.traverse((obj) => { if (obj.isMesh) obj.geometry?.dispose?.(); });
  };
}

function AboutRackBackdrop() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    let cancelled = false;
    let cleanup = null;
    import("three").then((THREE) => {
      if (!cancelled) cleanup = mountRack(THREE, wrap, canvas);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="about-rack-backdrop" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="about-rack-canvas" />
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
    { value: experiences.length, label: siteLabel(profile, "metricExperience") },
    { value: education.length, label: siteLabel(profile, "metricAcademic") },
    { value: skills.length, label: siteLabel(profile, "metricSkills") },
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
              {siteLabel(profile, "kickerProfile")}
            </div>
            <h2>{profile.aboutTitle || "Software engineer building AI systems, full-stack products, and practical digital solutions."}</h2>
            <p>{profile.bio}</p>
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
          </div>

          <aside className="about-profile-card" aria-label="Jirathiwat profile summary">
            <div className="about-portrait-wrap">
              {hasPortrait(profile) && (
                <div className="about-portrait-plate">
                  <PortraitReel profile={profile} alt={profile.name} />
                </div>
              )}
              <ArtFrame />
              <span className="about-orbit about-orbit-one" />
              <span className="about-orbit about-orbit-two" />
            </div>
            <div className="about-profile-body">
              <span className="about-status">
                <Sparkles size={15} />
                {siteLabel(profile, "availability")}
              </span>
              <h3>{profile.name}</h3>
              <p>{profile.role}</p>
              {profile.handle && (
                <p className="company">@{String(profile.handle).replace(/^@/, "")}</p>
              )}
              <div className="about-meta">
                <span>
                  <MapPin size={15} />
                  {profile.location}
                </span>
                <span>
                  <BriefcaseBusiness size={15} />
                  {siteLabel(profile, "company")}
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

      </section>
      </div>

      <StillGrid profile={profile} />

      <div className="page-content about-content-rest">
      <section className="section timeline-section reveal" id="experience">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <BriefcaseBusiness size={18} />
              {siteLabel(profile, "kickerExperience")}
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
              {siteLabel(profile, "kickerEducation")}
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
