import { Github, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { normalizeList, resolveMediaUrl } from "../utils";

export default function Projects({ content }) {
  const { profile, projects = [] } = content;

  return (
    <div className="page-content">
      <section className="section projects-section reveal" id="projects">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <Github size={18} />
              GitHub
            </div>
            <h2>{profile.headings?.projectsTitle || "Projects"}</h2>
            <p className="section-note">{profile.headings?.projectsDesc || "A collection of side projects, experiments, and open source contributions."}</p>
          </div>
          <a className="ghost-button" href={profile.github} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            GitHub
          </a>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              {project.imageUrl && (
                <Link className="project-media" to={`/projects/${project.id}`}>
                  <img src={resolveMediaUrl(project.imageUrl)} alt="" loading="lazy" />
                </Link>
              )}
              <div className="project-body">
                <div className="post-meta">
                  <span>{project.language || "Project"}</span>
                  <span>{project.period || project.updated || "Recent"}</span>
                </div>
                <h3>
                  <Link to={`/projects/${project.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {project.name}
                  </Link>
                </h3>
                {project.associated && <p className="company">{project.associated}</p>}
                <p>{project.description}</p>
                {normalizeList(project.highlights).length > 0 && (
                  <ul className="project-highlights">
                    {normalizeList(project.highlights)
                      .slice(0, 4)
                      .map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                  </ul>
                )}
                {normalizeList(project.skills).length > 0 && (
                  <div className="mini-skill-cloud">
                    {normalizeList(project.skills).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
                <div className="project-actions">
                  <Link className="primary-button" to={`/projects/${project.id}`}>
                    View Details
                    <ArrowRight size={16} style={{ marginLeft: 4 }} />
                  </Link>
                  {project.repoUrl && (
                    <a className="secondary-button" href={project.repoUrl} target="_blank" rel="noreferrer">
                      <Github size={16} />
                      Repo
                    </a>
                  )}
                  {project.liveUrl && (
                    <a className="secondary-button" href={project.liveUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={16} />
                      Live
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
