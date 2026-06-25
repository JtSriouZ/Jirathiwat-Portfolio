import { useState } from "react";
import { Terminal, Code, Cpu, Database, Layout, Box, Network, Code2, Globe, Braces, Cloud, BarChart, Sparkles, MonitorPlay, Cuboid } from "lucide-react";
import { getSkillIconUrl, normalizeList } from "../utils";

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
  const [error, setError] = useState(false);
  const iconUrl = error ? "" : getSkillIconUrl(skill);
  return (
    <div className="skill-card">
      {iconUrl ? (
        <img 
          src={iconUrl} 
          alt={skill} 
          style={{ width: "48px", height: "48px", objectFit: "contain" }}
          onError={() => setError(true)}
        />
      ) : (
        <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", transition: "all 0.2s ease" }} className="fallback-icon">
          {getFallbackIcon(skill)}
        </div>
      )}
      <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>{skill}</span>
    </div>
  );
}

export default function Skills({ content }) {
  const { expertise = [], profile = {} } = content;

  return (
    <div className="page-content">
      <section className="section skills-section reveal is-visible" id="skills">
        <div className="section-heading" style={{ marginBottom: "3rem", textAlign: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="section-kicker" style={{ justifyContent: "center" }}>
              <Code size={18} />
              Expertise
            </div>
            <h2 style={{ fontSize: "2.5rem" }}>{profile.headings?.skillsTitle || "Skills & Technologies"}</h2>
            <p style={{ maxWidth: "600px", margin: "1rem auto 0", color: "var(--text-muted)" }}>
              {profile.headings?.skillsDesc || "A comprehensive overview of my technical stack, frameworks, and core competencies."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {expertise.map((category) => (
            <div key={category.id} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "12px", 
                  background: "rgba(0, 240, 255, 0.1)", display: "flex", 
                  alignItems: "center", justifyContent: "center", color: "var(--cyan)" 
                }}>
                  {getCategoryIcon(category.id)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.8rem", margin: 0 }}>{category.category}</h3>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>{category.description}</p>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
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
