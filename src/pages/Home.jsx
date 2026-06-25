import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Github,
  ExternalLink,
  Mail,
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

export default function Home({ content, language }) {
  const { profile, experiences, certificates, projects } = content;

  const safeExperiences = actualRecords(experiences);
  const safeCerts = actualRecords(certificates);
  const safeProjects = actualRecords(projects);
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [activeProject, setActiveProject] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const previewDelay = 4200;

  const typingPhrases = useMemo(
    () => [
      profile.role,
      "Real-time AI systems builder",
      "Full-stack web application developer",
      "Computer vision and data science creator",
    ],
    [profile.role]
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
    <>
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
              <strong>{stat.value}</strong>
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
            <h2>Featured Projects</h2>
            <p className="section-note">A showcase of my recent work in software engineering, AI, and full-stack development.</p>
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

      <section className="section quick-section reveal">
        <div className="section-kicker">
          <LinkIcon size={18} />
          Explore
        </div>
        <div className="section-heading">
          <h2>Quick shortcuts</h2>
          <p className="section-note">Jump directly into the parts of the portfolio people usually want first.</p>
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
    </>
  );
}
