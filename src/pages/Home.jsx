import { useEffect, useMemo, useState } from "react";
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
import { resolveMediaUrl } from "../utils";
import ArtFrame from "../components/ArtFrame";
import PortraitReel, { hasPortrait } from "../components/PortraitReel";
import StillGrid from "../components/StillGrid";
import { siteLabel } from "../siteCopy";

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

export default function Home({ content, language }) {
  const { profile, experiences, certificates, projects, posts } = content;

  const safeExperiences = actualRecords(experiences);
  const safeCerts = actualRecords(certificates);
  const safeProjects = actualRecords(projects);
  const safePosts = actualRecords(posts);
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [portraitStep, setPortraitStep] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const previewDelay = 4200;

  const typingPhrases = useMemo(
    () => {
      if (profile.roles && profile.roles.length > 0) {
        return [profile.role, ...profile.roles].filter(Boolean);
      }
      return [
        profile.role,
        "Real-time AI systems builder",
        "Full-stack web application developer",
        "Computer vision and data science creator",
      ].filter(Boolean);
    },
    [profile.role, profile.roles]
  );
  const currentTypingPhrase = typingPhrases[typingIndex % Math.max(typingPhrases.length, 1)] || "";

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
    if (!currentTypingPhrase) return undefined;

    if (!isDeletingRole && typedText.length < currentTypingPhrase.length) {
      const timer = setTimeout(() => {
        setTypedText(currentTypingPhrase.slice(0, typedText.length + 1));
      }, 42);
      return () => clearTimeout(timer);
    }

    if (!isDeletingRole) {
      const timer = setTimeout(() => setIsDeletingRole(true), 1300);
      return () => clearTimeout(timer);
    }

    if (typedText.length > 0) {
      const timer = setTimeout(() => {
        setTypedText(currentTypingPhrase.slice(0, typedText.length - 1));
      }, 24);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setTypingIndex((index) => (index + 1) % typingPhrases.length);
      setIsDeletingRole(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [currentTypingPhrase, isDeletingRole, typedText, typingPhrases.length]);

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
    { label: siteLabel(profile, "statProjects"), value: String(safeProjects.length).padStart(2, "0") },
    { label: siteLabel(profile, "statExperience"), value: String(safeExperiences.length).padStart(2, "0") },
    { label: siteLabel(profile, "statCertificates"), value: String(safeCerts.length).padStart(2, "0") }
  ];

  const latestPosts = useMemo(
    () =>
      [...safePosts]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3),
    [safePosts]
  );

  const internalLinks = [
    { label: siteLabel(profile, "linkProjects"), to: "/projects", icon: <Github size={18} /> },
    { label: siteLabel(profile, "linkCertificates"), to: "/certificates", icon: <Award size={18} /> },
    { label: siteLabel(profile, "linkAcademic"), to: "/about", icon: <GraduationCap size={18} /> },
    { label: siteLabel(profile, "linkExperience"), to: "/about", icon: <BriefcaseBusiness size={18} /> },
    { label: siteLabel(profile, "linkBlog"), to: "/blog", icon: <Mail size={18} /> }
  ];

  const externalLinks = [
    { label: siteLabel(profile, "githubButton"), href: profile.github, icon: <ExternalLink size={18} /> },
    profile.instagram
      ? { label: siteLabel(profile, "instagramButton"), href: profile.instagram, icon: <ExternalLink size={18} /> }
      : null,
  ].filter(Boolean);

  const nameParts = (profile.name || "Jirathiwat Suntipreedatham").split(" ");
  const givenName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const personaMarks = Array.isArray(profile.persona) && profile.persona.length
    ? profile.persona
    : [
        "CEO — Snail.aes",
        "President — MU Shooting",
        "MUICT · ICT22",
        "MU 135",
        profile.location || "Bangkok, Thailand",
        "Vol. MMXXVI"
      ];
  const tickerMarks = [...personaMarks, ...personaMarks];

  return (
    <div className="home-cinematic-page">
      <section className="hero-section hero-editorial">
        <div className="hero-split reveal is-visible">
          <div className="hero-copy-col">
            <p className="hero-greeting">
              {language === "th"
                ? siteLabel(profile, "heroGreetingTh")
                : language === "zh-CN"
                ? siteLabel(profile, "heroGreetingZh")
                : siteLabel(profile, "heroGreeting")}
            </p>
            <h1 className="hero-title">
              <span>{givenName}</span>
              {familyName ? <span>{familyName}</span> : null}
            </h1>
            <p className="hero-copy">{profile.headline}</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/about">
                {siteLabel(profile, "heroContact")}
                <ArrowRight size={18} />
              </Link>
              <Link className="secondary-button" to="/projects">
                {siteLabel(profile, "heroWork")}
              </Link>
            </div>
            <div className="command-bar" aria-label="Current role">
              <Sparkles size={14} />
              <span>{typedText || currentTypingPhrase || profile.role}</span>
            </div>
            <div className="signal-panel">
              {stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <RandomNumber value={stat.value} />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          {hasPortrait(profile) && (
            <div className="hero-seal-col">
              <div className="hero-seal" tabIndex={0} aria-label={`${profile.name} portrait`}>
                <div className="hero-seal-plate">
                  <PortraitReel
                    profile={profile}
                    alt=""
                    onIndex={setPortraitStep}
                  />
                </div>
                <ArtFrame />
              </div>
              <p className="hero-seal-caption" aria-hidden="true">
                <span>{siteLabel(profile, "portraitFig")} {String(portraitStep + 1).padStart(2, "0")}</span>
                <span>{siteLabel(profile, "portraitCaption")}</span>
              </p>
            </div>
          )}
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <div className="hero-ticker-track">
            {tickerMarks.map((mark, index) => (
              <span key={`${mark}-${index}`}>
                <i />
                {mark}
              </span>
            ))}
          </div>
        </div>
      </section>

      <StillGrid profile={profile} />

      {activeProjectData && (
        <section
          className="section project-showcase-section reveal"
          onMouseEnter={() => setIsPreviewPaused(true)}
          onMouseLeave={() => setIsPreviewPaused(false)}
          onFocus={() => setIsPreviewPaused(true)}
          onBlur={() => setIsPreviewPaused(false)}
        >
          <div className="section-kicker">
            <Rocket size={16} />
            {siteLabel(profile, "kickerWorks")}
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
                  <>
                    <img className="thumb-fill" src={resolveMediaUrl(activeProjectData.imageUrl)} alt="" aria-hidden="true" />
                    <img className="thumb-subject" src={resolveMediaUrl(activeProjectData.imageUrl)} alt={activeProjectData.name} />
                  </>
                )}
                <div className="project-scanline" />
                <div className="project-preview-badge">
                  <Code2 size={16} />
                  {activeProjectData.language || siteLabel(profile, "projectFallback")}
                </div>
              </Link>

              <div className="project-stepper" aria-label="Project stream control">
                <div>
                  <span>
                    {String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
                  </span>
                  <strong>{nextProjectData ? `${siteLabel(profile, "nextPrefix")} ${nextProjectData.name}` : activeProjectData.name}</strong>
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
                  {siteLabel(profile, "viewPiece")}
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
            <Newspaper size={16} />
            {siteLabel(profile, "kickerJournal")}
          </div>
          <div className="section-heading">
            <h2>{profile.headings?.blogTitle || "Latest posts"}</h2>
            <p className="section-note">{profile.headings?.blogDesc || "Thoughts, news, and technical articles."}</p>
          </div>
          <div className="home-post-grid">
            {latestPosts.map((post) => (
              <Link className="home-post-card" key={post.id} to={`/blog/${post.id}`}>
                {post.imageUrl && (
                  <span className="home-post-media thumb">
                    <img
                      src={resolveMediaUrl(post.imageUrl)}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        const frame = event.currentTarget.closest(".thumb");
                        if (frame) frame.hidden = true;
                      }}
                    />
                  </span>
                )}
                <div className="home-post-copy">
                  <div className="post-meta">
                    <span>{post.category || siteLabel(profile, "postFallback")}</span>
                    <span>
                      <CalendarDays size={14} />
                      {post.date || siteLabel(profile, "recentFallback")}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <span className="read-more-link">
                    {siteLabel(profile, "readPost")}
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
          <LinkIcon size={16} />
          {siteLabel(profile, "kickerGallery")}
        </div>
        <div className="section-heading">
          <h2>{profile.headings?.homeUpdatesTitle || "Quick shortcuts"}</h2>
          <p className="section-note">{profile.headings?.homeUpdatesDesc || "Jump directly into the parts of the portfolio people usually want first."}</p>
        </div>
        <div className="feature-grid">
          {internalLinks.map((link, index) => (
            <Link className="feature-card" key={link.label} to={link.to}>
              <em>#{String(index + 1).padStart(2, "0")}</em>
              {link.icon}
              <strong>{link.label}</strong>
              <ArrowRight size={16} />
            </Link>
          ))}
          {externalLinks.map((link, index) => (
            <a className="feature-card" key={link.label} href={link.href} target="_blank" rel="noreferrer">
              <em>#{String(internalLinks.length + index + 1).padStart(2, "0")}</em>
              {link.icon}
              <strong>{link.label}</strong>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
