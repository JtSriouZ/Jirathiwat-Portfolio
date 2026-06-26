import { useState, useEffect, useRef } from "react";
import { Code2, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, Github, Linkedin, Instagram, Mail } from "lucide-react";
import { normalizeList, resolveMediaUrl } from "../utils";

const ABOUT_RACK_MODEL_URL = "https://raw.githubusercontent.com/SethiShreya/3D-Server-Rack/main/server_rack.glb";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AboutRackBackdrop() {
  const wrapRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const model = modelRef.current;
    if (!wrap || !model) return undefined;

    let frameId = 0;
    let readyFallbackId = 0;
    const markReady = () => {
      wrap.classList.add("is-ready");
    };

    const update = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      const sway = Math.sin(progress * Math.PI * 2.35);
      const lift = Math.cos(progress * Math.PI * 2.05);
      const orbit = 34 + sway * 18 + progress * 18;
      const elevation = 68 + lift * 8 - progress * 6;
      const radius = 8.4 - progress * 1.8;
      const fov = 30 - progress * 5;

      wrap.style.setProperty("--about-rack-progress", progress.toFixed(3));
      wrap.style.setProperty("--about-rack-sway", sway.toFixed(3));
      wrap.style.setProperty("--about-rack-lift", lift.toFixed(3));
      model.setAttribute("camera-orbit", `${orbit.toFixed(2)}deg ${elevation.toFixed(2)}deg ${radius.toFixed(2)}m`);
      model.setAttribute("field-of-view", `${fov.toFixed(2)}deg`);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    model.addEventListener("load", markReady);
    readyFallbackId = window.setTimeout(() => {
      wrap.classList.add("is-ready");
    }, 4200);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(readyFallbackId);
      model.removeEventListener("load", markReady);
    };
  }, []);

  return (
    <div className="about-rack-backdrop" ref={wrapRef} aria-hidden="true">
      <model-viewer
        ref={modelRef}
        class="about-rack-model"
        title="Decorative 3D data center rack"
        src={ABOUT_RACK_MODEL_URL}
        camera-orbit="34deg 68deg 8.4m"
        field-of-view="30deg"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="6deg"
        shadow-intensity="0.72"
        exposure="0.9"
        environment-image="neutral"
        interaction-prompt="none"
        disable-zoom
        disable-pan
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
