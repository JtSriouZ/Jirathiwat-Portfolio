import { useParams, Link } from "react-router-dom";
import { Github, ExternalLink, ArrowLeft, Calendar, Building2, Code2 } from "lucide-react";
import { normalizeList, resolveMediaUrl } from "../utils";

function presentHighlights(value) {
  const lines = normalizeList(value).flatMap((item) => String(item).split(/\n+/));
  const highlights = [];
  lines.forEach((line) => {
    const text = line.trim();
    if (!text) return;
    const previous = highlights.at(-1);
    if (previous && !/[.!?]$/.test(previous) && /^[a-z]/.test(text)) {
      highlights[highlights.length - 1] = `${previous}, ${text}`;
      return;
    }
    highlights.push(text);
  });
  return highlights;
}
import { siteLabel } from "../siteCopy";
import MediaGallery from "../components/MediaGallery";
import RichContent, { getInlineMediaUsage } from "../components/RichContent";

export default function ProjectDetail({ content }) {
  const { id } = useParams();
  const { projects = [], profile = {} } = content;
  
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="page-content detail-missing">
        <h2>{siteLabel(profile, "projectMissing")}</h2>
        <p>{siteLabel(profile, "projectMissingNote")}</p>
        <br />
        <Link to="/projects" className="primary-button">{siteLabel(profile, "backToProjects")}</Link>
      </div>
    );
  }

  const highlights = presentHighlights(project.highlights);
  const skills = normalizeList(project.skills);
  const mediaUrls = normalizeList(project.mediaUrls);
  
  const descriptionText = project.fullDescription || project.description;
  const inlineMedia = getInlineMediaUsage(descriptionText, mediaUrls);
  const galleryUrls = mediaUrls.filter((url, index) => !inlineMedia.usedIndexes.has(index) && !inlineMedia.usedUrls.has(url));

  return (
    <div className="page-content">
      <section className="section project-detail-section reveal is-visible">
        <div className="project-detail-header">
          <Link to="/projects" className="ghost-button" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <ArrowLeft size={16} />
            {siteLabel(profile, "backToProjects")}
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Code2 size={14} />
              {project.language || siteLabel(profile, "projectFallback")}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {project.period || project.updated || siteLabel(profile, "recentFallback")}
            </span>
            {project.associated && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Building2 size={14} />
                {project.associated}
              </span>
            )}
          </div>
          
          <h1 style={{ marginBottom: "1.5rem" }}>{project.name}</h1>
          
          <div className="project-actions" style={{ marginBottom: "2rem" }}>
            {project.repoUrl && (
              <a className="secondary-button" href={project.repoUrl} target="_blank" rel="noreferrer">
                <Github size={16} />
                {siteLabel(profile, "repositoryButton")}
              </a>
            )}
            {project.liveUrl && (
              <a className="primary-button" href={project.liveUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                {siteLabel(profile, "liveDemo")}
              </a>
            )}
          </div>
        </div>

        {project.imageUrl && (
          <div className="project-detail-hero">
            <img className="thumb-fill" src={resolveMediaUrl(project.imageUrl)} alt="" aria-hidden="true" />
            <img className="thumb-subject" src={resolveMediaUrl(project.imageUrl)} alt={project.name} />
          </div>
        )}

        <div className="project-detail-content">
          <h2>{siteLabel(profile, "aboutProject")}</h2>
          <RichContent text={descriptionText} mediaUrls={mediaUrls} itemTitle={project.name} />
          
          {highlights.length > 0 && (
            <>
              <h3>{siteLabel(profile, "keyFeatures")}</h3>
              <ul className="project-highlights" style={{ marginBottom: "2rem" }}>
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </>
          )}

          <MediaGallery urls={galleryUrls} itemTitle="Project media" />

          {skills.length > 0 && (
            <>
              <h3>{siteLabel(profile, "technologiesUsed")}</h3>
              <div className="mini-skill-cloud">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
