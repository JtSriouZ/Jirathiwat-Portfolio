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
    scene.fog = new THREE.FogExp2(0x030810, 0.04);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const rack = new THREE.Group();
    const neon = new THREE.Group();
    const dustGroup = new THREE.Group();
    scene.add(rack, neon, dustGroup);

    /* --- Materials --- */
    const metal = new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.18, metalness: 0.92 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x040810, roughness: 0.35, metalness: 0.94 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x88eeff, transparent: true, opacity: 0.18,
      roughness: 0.02, metalness: 0.2, transmission: 0.15,
      thickness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1,
    });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0e1824, roughness: 0.28, metalness: 0.78 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3e, roughness: 0.15, metalness: 0.95 });
    const cyanG = new THREE.MeshBasicMaterial({ color: 0x65e8ff });
    const amberG = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const greenG = new THREE.MeshBasicMaterial({ color: 0x91ffcf });
    const magentaG = new THREE.MeshBasicMaterial({ color: 0xff6fd8 });
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x44eebb, roughness: 0.22, metalness: 0.3,
      emissive: 0x0e6c55, emissiveIntensity: 0.9,
    });

    const addBox = (name, size, pos, mat, parent = rack) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      m.name = name; m.position.set(...pos); parent.add(m); return m;
    };

    /* --- Rack frame --- */
    addBox("shell", [2.28, 5.4, 1.08], [0, 0, 0], darkMetal);
    addBox("back-glow", [2.04, 4.92, 0.04], [0, 0.08, -0.56],
      new THREE.MeshBasicMaterial({ color: 0x0a1e38, transparent: true, opacity: 0.75 }));

    // Side glow strips
    const sideG = new THREE.MeshBasicMaterial({ color: 0x65e8ff, transparent: true, opacity: 0.12 });
    addBox("l-strip", [0.02, 5.2, 0.04], [-1.16, 0, 0.64], sideG);
    addBox("r-strip", [0.02, 5.2, 0.04], [1.16, 0, 0.64], sideG);

    // Rails & caps
    addBox("l-rail", [0.12, 5.72, 1.28], [-1.22, 0, 0], metal);
    addBox("r-rail", [0.12, 5.72, 1.28], [1.22, 0, 0], metal);
    addBox("top", [2.52, 0.14, 1.28], [0, 2.86, 0], metal);
    addBox("bot", [2.52, 0.16, 1.28], [0, -2.86, 0], metal);

    // Glass door + frame
    addBox("door", [2.02, 4.86, 0.045], [0, 0.05, 0.66], glass);
    addBox("dtop", [2.08, 0.06, 0.08], [0, 2.48, 0.66], metal);
    addBox("dbot", [2.08, 0.06, 0.08], [0, -2.38, 0.66], metal);

    /* --- Server blades --- */
    for (let i = 0; i < 12; i++) {
      const y = 2.25 - i * 0.38;
      const b = addBox(`bl-${i}`, [1.78, 0.24, 0.18], [0, y, 0.48], bladeMat);
      b.rotation.x = 0.01;
      addBox(`hd-${i}`, [0.24, 0.08, 0.04], [-0.72, y, 0.60], handleMat);
      const lc = i % 3 === 0 ? 0xff6fd8 : i % 2 === 0 ? 0xffaa00 : 0x65e8ff;
      addBox(`ln-${i}`, [1.2, 0.016, 0.015], [-0.18, y + 0.014, 0.59],
        new THREE.MeshBasicMaterial({ color: lc, transparent: true, opacity: 0.2 }), rack);
      for (let j = 0; j < 5; j++) {
        const gm = [cyanG, greenG, amberG, magentaG][(i + j) % 4];
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), gm);
        dot.position.set(0.68 + j * 0.14, y + 0.015, 0.62);
        dot.userData = { pulse: i * 0.42 + j * 0.7 };
        neon.add(dot);
      }
    }

    /* --- Vents --- */
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 8; r++) {
        addBox(`v-${c}-${r}`, [0.32, 0.022, 0.02], [-0.82 + c * 0.34, 2.1 - r * 0.14, 0.63],
          new THREE.MeshBasicMaterial({ color: 0x8baeff, transparent: true, opacity: 0.18 }), rack);
      }
    }

    /* --- Cables --- */
    const curves = [
      [[-0.68,0.1,0.63],[-0.38,-0.34,0.92],[0.38,-0.22,0.86],[0.72,-0.68,0.63]],
      [[-0.58,-0.65,0.63],[-0.1,-1.02,0.94],[0.58,-0.92,0.78],[0.8,-1.28,0.63]],
      [[0.62,0.85,0.63],[0.18,0.45,0.9],[-0.44,0.52,0.84],[-0.78,0.22,0.63]],
      [[0.45,1.6,0.63],[0.82,1.1,0.88],[0.92,0.4,0.82],[0.78,-0.1,0.63]],
    ];
    curves.forEach((pts, i) => {
      const cv = new THREE.CatmullRomCurve3(pts.map(([x,y,z]) => new THREE.Vector3(x,y,z)));
      rack.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 42, 0.016 + i * 0.003, 8, false), cableMat));
    });

    /* --- Neon rings --- */
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x65e8ff, transparent: true, opacity: 0.24 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.005, 8, 96), ringMat);
    ring.rotation.x = Math.PI * 0.5; ring.position.set(0, 0, 0.72); neon.add(ring);

    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff6fd8, transparent: true, opacity: 0.14 });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.003, 8, 96), ring2Mat);
    ring2.rotation.x = Math.PI * 0.5; ring2.position.set(0, 0, 0.5); neon.add(ring2);

    /* --- Floating dust --- */
    const dustCount = 50;
    const dArr = [];
    for (let i = 0; i < dustCount; i++) dArr.push((Math.random()-0.5)*8, (Math.random()-0.5)*8, (Math.random()-0.5)*4+1);
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.Float32BufferAttribute(dArr, 3));
    const dMat = new THREE.PointsMaterial({ color: 0x65e8ff, size: 0.025, transparent: true, opacity: 0.3, sizeAttenuation: true });
    dustGroup.add(new THREE.Points(dGeo, dMat));

    /* --- Floor reflection --- */
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x060e18, roughness: 0.15, metalness: 0.95, transparent: true, opacity: 0.5 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -3.1; scene.add(floor);

    /* --- Lighting --- */
    scene.add(new THREE.AmbientLight(0xaecbff, 0.5));
    const kl = new THREE.DirectionalLight(0xffffff, 2.0); kl.position.set(3, 5, 4); scene.add(kl);
    const cl = new THREE.PointLight(0x65e8ff, 5.0, 9); cl.position.set(-2, 2, 2.5); scene.add(cl);
    const wl = new THREE.PointLight(0xffaa00, 3.5, 8); wl.position.set(2, -1.5, 2.4); scene.add(wl);
    const rl = new THREE.DirectionalLight(0xff6fd8, 3.0); rl.position.set(4, 2, -4); scene.add(rl);
    const bl = new THREE.PointLight(0x65e8ff, 2.0, 6); bl.position.set(0, -3.5, 1.5); scene.add(bl);

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
      const sec = time * 0.001;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      const sway = Math.sin(progress * Math.PI * 2.35);
      const lift = Math.cos(progress * Math.PI * 2.05);

      wrap.style.setProperty("--about-rack-progress", progress.toFixed(3));
      wrap.style.setProperty("--about-rack-sway", sway.toFixed(3));
      wrap.style.setProperty("--about-rack-lift", lift.toFixed(3));

      rack.rotation.y = -0.32 + sway * 0.24 + progress * 0.18 + Math.sin(sec * 0.32) * 0.035;
      rack.rotation.x = 0.04 + lift * 0.035;
      rack.rotation.z = -0.018 + Math.sin(sec * 0.22) * 0.012;
      neon.rotation.copy(rack.rotation);

      ring.rotation.z = sec * 0.22;
      ringMat.opacity = 0.18 + Math.sin(sec * 1.2) * 0.06;
      ring2.rotation.z = -sec * 0.15;
      ring2Mat.opacity = 0.1 + Math.sin(sec * 0.9 + 1.5) * 0.04;

      neon.children.forEach((ch) => {
        if (ch.userData.pulse !== undefined) {
          ch.scale.setScalar(0.8 + Math.sin(sec * 3.8 + ch.userData.pulse) * 0.4);
        }
      });

      // Dust drift
      const dp = dGeo.attributes.position;
      for (let i = 0; i < dustCount; i++) dp.setY(i, dp.getY(i) + Math.sin(sec * 0.5 + i) * 0.001);
      dp.needsUpdate = true;
      dMat.opacity = 0.22 + Math.sin(sec * 0.8) * 0.08;

      // Camera: pull far back and to the right so rack is small and in the corner
      camera.position.set(6.5 + sway * 0.2, 0.2 + lift * 0.15, 18.0 - progress * 0.6);
      camera.lookAt(3.5, -0.1, 0);

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
      scene.traverse((obj) => { if (obj.isMesh) obj.geometry?.dispose?.(); });
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
