import { Code2, BriefcaseBusiness, GraduationCap, MapPin, Sparkles, Github, Linkedin, Instagram, Mail } from "lucide-react";
import { normalizeList, resolveMediaUrl } from "../utils";

export default function About({ content }) {
  const { profile, experiences, education = [] } = content;
  const skills = normalizeList(profile.skills);
  const aboutStats = [
    { value: String(experiences.length).padStart(2, "0"), label: "Experience" },
    { value: String(education.length).padStart(2, "0"), label: "Academic" },
    { value: String(skills.length).padStart(2, "0"), label: "Core skills" },
  ];

  return (
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
              <strong>{stat.value}</strong>
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
            <h2>Work history</h2>
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
            <h2>Academic path</h2>
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
  );
}
