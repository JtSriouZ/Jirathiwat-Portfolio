import { useState, useEffect } from "react";
import { Terminal, Code, Cpu, Database, Layout, Box, Network, Code2, Globe, Braces, Cloud, BarChart, Sparkles, MonitorPlay, Cuboid } from "lucide-react";
import { getSkillIconUrls, normalizeList } from "../utils";
import { siteLabel } from "../siteCopy";

function getCategoryIcon(categoryId) {
  if (categoryId.includes("ai")) return <Cpu size={24} />;
  if (categoryId.includes("backend") || categoryId.includes("data")) return <Database size={24} />;
  if (categoryId.includes("frontend")) return <Layout size={24} />;
  if (categoryId.includes("software")) return <Code size={24} />;
  if (categoryId.includes("prompt")) return <Sparkles size={24} />;
  if (categoryId.includes("3d")) return <Cuboid size={24} />;
  if (categoryId.includes("media")) return <MonitorPlay size={24} />;
  return <Terminal size={24} />;
}

function getFallbackIcon(skill) {
  const s = skill.toLowerCase();
  if (s.includes("system design")) return <Network size={32} strokeWidth={1.5} />;
  if (s.includes("ui") || s.includes("ux") || s.includes("design")) return <Layout size={32} strokeWidth={1.5} />;
  if (s.includes("3d") || s.includes("model")) return <Cuboid size={32} strokeWidth={1.5} />;
  if (s.includes("prompt") || s.includes("generative")) return <Sparkles size={32} strokeWidth={1.5} />;
  if (s.includes("image") || s.includes("video") || s.includes("media")) return <MonitorPlay size={32} strokeWidth={1.5} />;
  if (s.includes("programming")) return <Code2 size={32} strokeWidth={1.5} />;
  if (s.includes("test") || s.includes("ci/cd")) return <Terminal size={32} strokeWidth={1.5} />;
  if (s.includes("sql") || s.includes("database")) return <Database size={32} strokeWidth={1.5} />;
  if (s.includes("algorithm")) return <Code2 size={32} strokeWidth={1.5} />;
  if (s.includes("system") || s.includes("network")) return <Network size={32} strokeWidth={1.5} />;
  if (s.includes("api")) return <Globe size={32} strokeWidth={1.5} />;
  if (s.includes("data structure")) return <Braces size={32} strokeWidth={1.5} />;
  if (s.includes("cloud") || s.includes("heroku") || s.includes("aws")) return <Cloud size={32} strokeWidth={1.5} />;
  if (s.includes("plot") || s.includes("chart")) return <BarChart size={32} strokeWidth={1.5} />;
  if (s.includes("learning") || s.includes("ai")) return <Cpu size={32} strokeWidth={1.5} />;
  return <Box size={32} strokeWidth={1.5} />;
}

function SkillCard({ skill }) {
  const urls = getSkillIconUrls(skill);
  const [urlIndex, setUrlIndex] = useState(0);
  
  // If we exhaust the array, fallback
  const currentUrl = urlIndex < urls.length ? urls[urlIndex] : "";

  return (
    <div className="skill-card">
      {currentUrl ? (
        <img
          src={currentUrl}
          alt=""
          className="skill-card-icon"
          loading="lazy"
          decoding="async"
          onError={() => setUrlIndex(i => i + 1)}
        />
      ) : (
        <div className="fallback-icon skill-card-icon">
          {getFallbackIcon(skill)}
        </div>
      )}
      <span>{skill}</span>
    </div>
  );
}

export default function Skills({ content }) {
  const { expertise = [], profile = {} } = content;

  return (
    <div className="page-content">
      <section className="section skills-section reveal" id="skills">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <Code size={18} />
              {siteLabel(profile, "kickerSkills")}
            </div>
            <h2>{profile.headings?.skillsTitle || "Skills & Technologies"}</h2>
            <p className="section-note">
              {profile.headings?.skillsDesc || "A comprehensive overview of my technical stack, frameworks, and core competencies."}
            </p>
          </div>
        </div>

        <div className="skill-groups">
          {expertise.map((category) => (
            <div className="skill-group" key={category.id}>
              <div className="skill-group-head">
                <span className="skill-group-mark">{getCategoryIcon(category.id)}</span>
                <div>
                  <h3>{category.category}</h3>
                  <p>{category.description}</p>
                </div>
              </div>
              <div className="skill-grid">
                {normalizeList(category.skills).map((skill) => (
                  <SkillCard key={skill} skill={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
