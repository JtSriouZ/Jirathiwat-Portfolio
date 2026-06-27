import { useParams, Link } from "react-router-dom";
import { Github, ExternalLink, ArrowLeft, Calendar, Building2, Code2 } from "lucide-react";
import { normalizeList, resolveMediaUrl } from "../utils";
import MediaGallery from "../components/MediaGallery";
import RichContent, { getInlineMediaUsage } from "../components/RichContent";

export default function ProjectDetail({ content }) {
  const { id } = useParams();
  const { projects = [] } = content;
  
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h2>Project Not Found</h2>
        <p>The project you are looking for does not exist.</p>
        <br />
        <Link to="/projects" className="primary-button">Back to Projects</Link>
      </div>
    );
  }

  const highlights = normalizeList(project.highlights);
  const skills = normalizeList(project.skills);
  const mediaUrls = normalizeList(project.mediaUrls);
  
  const descriptionText = project.fullDescription || project.description;
  const { usedIndexes, usedUrls } = getInlineMediaUsage(descriptionText, mediaUrls);
  const remainingMediaUrls = mediaUrls.filter((url, index) => !usedIndexes.has(index) && !usedUrls.has(url));

  return (
    <div className="page-content">
      <section className="section project-detail-section reveal is-visible">
        <div className="project-detail-header">
          <Link to="/projects" className="ghost-button" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Code2 size={14} />
              {project.language || "Project"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {project.period || project.updated || "Recent"}
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
                Repository
              </a>
            )}
            {project.liveUrl && (
              <a className="primary-button" href={project.liveUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Live Demo
              </a>
            )}
          </div>
        </div>

        {project.imageUrl && (
          <div className="project-detail-image" style={{ marginBottom: "3rem", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line)" }}>
            <img 
              src={resolveMediaUrl(project.imageUrl)} 
              alt={project.name} 
              style={{ width: "100%", height: "auto", display: "block" }} 
            />
          </div>
        )}

        <div className="project-detail-content" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2>About the Project</h2>
          <RichContent text={descriptionText} mediaUrls={mediaUrls} itemTitle={project.name} />
          
          {highlights.length > 0 && (
            <>
              <h3>Key Features & Highlights</h3>
              <ul className="project-highlights" style={{ marginBottom: "2rem" }}>
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </>
          )}

          <MediaGallery urls={remainingMediaUrls} itemTitle="Project media" />

          {skills.length > 0 && (
            <>
              <h3>Technologies Used</h3>
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
