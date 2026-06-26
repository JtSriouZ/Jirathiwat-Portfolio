import { useState, useEffect, useRef } from "react";
import { Code2, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, Github, Linkedin, Instagram, Mail } from "lucide-react";
import * as THREE from "three";
import { normalizeList, resolveMediaUrl } from "../utils";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AboutRackBackdrop() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const rack = new THREE.Group();
    const neon = new THREE.Group();
    scene.add(rack, neon);

    const metal = new THREE.MeshStandardMaterial({
      color: 0x08101a,
      roughness: 0.2,
      metalness: 0.88,
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x030508,
      roughness: 0.45,
      metalness: 0.9,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x77e8ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.15,
      transmission: 0.1,
      thickness: 0.18,
    });
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111b2a,
      roughness: 0.32,
      metalness: 0.72,
    });
    const cyanLight = new THREE.MeshBasicMaterial({ color: 0x65e8ff });
    const amberLight = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const greenLight = new THREE.MeshBasicMaterial({ color: 0x91ffcf });
    const magentaLight = new THREE.MeshBasicMaterial({ color: 0xff6fd8 });
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x53f0d4,
      roughness: 0.28,
      metalness: 0.25,
      emissive: 0x0e4c43,
      emissiveIntensity: 0.7,
    });

    const addBox = (name, size, position, material, parent = rack) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    };

    addBox("rack-shell", [2.28, 5.4, 1.08], [0, 0, 0], darkMetal);
    addBox("rack-back-glow", [2.04, 4.92, 0.05], [0, 0.08, -0.57], new THREE.MeshBasicMaterial({ color: 0x14233a, transparent: true, opacity: 0.62 }));
    addBox("left-rail", [0.12, 5.72, 1.28], [-1.22, 0, 0], metal);
    addBox("right-rail", [0.12, 5.72, 1.28], [1.22, 0, 0], metal);
    addBox("top-cap", [2.52, 0.14, 1.28], [0, 2.86, 0], metal);
    addBox("bottom-cap", [2.52, 0.16, 1.28], [0, -2.86, 0], metal);
    addBox("glass-door", [2.02, 4.86, 0.055], [0, 0.05, 0.66], glass);

    for (let index = 0; index < 12; index += 1) {
      const y = 2.25 - index * 0.38;
      const blade = addBox(`server-blade-${index}`, [1.78, 0.24, 0.18], [0, y, 0.48], bladeMaterial);
      blade.rotation.x = 0.01;
      addBox(`blade-line-${index}`, [1.2, 0.018, 0.02], [-0.18, y + 0.015, 0.59], new THREE.MeshBasicMaterial({ color: 0x65e8ff, transparent: true, opacity: 0.22 }), rack);

      for (let led = 0; led < 5; led += 1) {
        const material = [cyanLight, greenLight, amberLight, magentaLight][(index + led) % 4];
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), material);
        dot.position.set(0.68 + led * 0.14, y + 0.015, 0.61);
        dot.userData = { pulse: index * 0.42 + led * 0.7 };
        neon.add(dot);
      }
    }

    for (let col = 0; col < 2; col += 1) {
      for (let row = 0; row < 6; row += 1) {
        addBox(`vent-${col}-${row}`, [0.42, 0.03, 0.025], [-0.76 + col * 0.38, 1.96 - row * 0.17, 0.62], new THREE.MeshBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.24 }), rack);
      }
    }

    const cableCurves = [
      [[-0.68, 0.1, 0.63], [-0.38, -0.34, 0.92], [0.38, -0.22, 0.86], [0.72, -0.68, 0.63]],
      [[-0.58, -0.65, 0.63], [-0.1, -1.02, 0.94], [0.58, -0.92, 0.78], [0.8, -1.28, 0.63]],
      [[0.62, 0.85, 0.63], [0.18, 0.45, 0.9], [-0.44, 0.52, 0.84], [-0.78, 0.22, 0.63]],
    ];
    cableCurves.forEach((points, index) => {
      const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.018 + index * 0.004, 8, false), cableMaterial);
      rack.add(cable);
    });

    const ringGeometry = new THREE.TorusGeometry(1.72, 0.006, 8, 96);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x65e8ff, transparent: true, opacity: 0.28 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(0, 0, 0.72);
    neon.add(ring);

    scene.add(new THREE.AmbientLight(0xaecbff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const cyan = new THREE.PointLight(0x65e8ff, 4.5, 7);
    cyan.position.set(-1.6, 1.8, 2.2);
    scene.add(cyan);
    const warm = new THREE.PointLight(0xffaa00, 3.8, 8);
    warm.position.set(1.8, -1.2, 2.4);
    scene.add(warm);

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
      const seconds = time * 0.001;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      const sway = Math.sin(progress * Math.PI * 2.35);
      const lift = Math.cos(progress * Math.PI * 2.05);

      wrap.style.setProperty("--about-rack-progress", progress.toFixed(3));
      wrap.style.setProperty("--about-rack-sway", sway.toFixed(3));
      wrap.style.setProperty("--about-rack-lift", lift.toFixed(3));

      rack.rotation.y = -0.38 + sway * 0.32 + progress * 0.22 + Math.sin(seconds * 0.38) * 0.045;
      rack.rotation.x = 0.06 + lift * 0.045;
      rack.rotation.z = -0.025 + Math.sin(seconds * 0.28) * 0.018;
      neon.rotation.copy(rack.rotation);
      ring.rotation.z = seconds * 0.28;
      ringMaterial.opacity = 0.2 + Math.sin(seconds * 1.4) * 0.05;

      neon.children.forEach((dot) => {
        const pulse = 0.85 + Math.sin(seconds * 4.2 + dot.userData.pulse) * 0.45;
        dot.scale.setScalar(pulse);
      });

      camera.position.set(-2.5 + sway * 0.72, 0.22 + lift * 0.28, 14.5 - progress * 1.25);
      camera.lookAt(0, -0.1, 0.18);

      renderer.render(scene, camera);
      wrap.classList.add("is-ready");
      frameId = requestAnimationFrame(animate);
    };

    resize();
    frameId = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose?.();
      });
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
