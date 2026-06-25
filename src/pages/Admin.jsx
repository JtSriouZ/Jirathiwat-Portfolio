import { useState, useEffect } from "react";
import { Edit3, Save, Trash2, Plus } from "lucide-react";
import { resolveMediaUrl, normalizeList } from "../utils";

const blankPost = { title: "", category: "News", date: new Date().toISOString().slice(0, 10), summary: "", fullDescription: "", imageUrl: "", mediaUrls: "", youtubeUrl: "", externalUrl: "" };
const blankExperience = { role: "", company: "", period: "", description: "" };
const blankEducation = { school: "", program: "", period: "", description: "", skills: "" };
const blankCertificate = { title: "", issuer: "", date: "", credentialUrl: "", imageUrl: "", mediaUrls: "", description: "", fullDescription: "", skills: "" };
const blankProject = { title: "", description: "", fullDescription: "", language: "", repoUrl: "", liveUrl: "", imageUrl: "", mediaUrls: "", updated: "", period: "", associated: "", skills: "", highlights: "", featuredRank: "" };
const blankExpertise = { category: "", description: "", skills: "" };

function isTemporaryId(id) {
  return !id || String(id).startsWith("temp-");
}

export async function api(path, options = {}) {
  const token = sessionStorage.getItem("portfolioAdminToken");
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }
  if (response.status === 204) return null;
  return response.json();
}

export default function AdminPanel({ content, canEdit, onRefresh, onNavigate }) {
  const safeSkills = Array.isArray(content.profile.skills)
    ? content.profile.skills
    : String(content.profile.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  const [profile, setProfile] = useState({
    ...content.profile,
    skills: safeSkills.join(", ")
  });
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem("portfolioAdminToken") || "");
  const [password, setPassword] = useState("");
  
  const [posts, setPosts] = useState(content.posts || []);
  const [experiences, setExperiences] = useState(content.experiences || []);
  const [educations, setEducations] = useState(content.education || []);
  const [certificates, setCertificates] = useState(content.certificates || []);
  const [projects, setProjects] = useState(content.projects || []);
  const [expertiseList, setExpertiseList] = useState(content.expertise || []);
  
  const [avatarPreview, setAvatarPreview] = useState(resolveMediaUrl(content.profile.avatar || ""));
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const canSave = canEdit && Boolean(adminToken);

  const updateHeading = (key, value) => {
    setProfile({
      ...profile,
      headings: {
        ...(profile.headings || {}),
        [key]: value
      }
    });
  };

  useEffect(() => {
    const safeSkills = Array.isArray(content.profile.skills)
      ? content.profile.skills
      : String(content.profile.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
    setProfile({ ...content.profile, skills: safeSkills.join(", ") });
    setAvatarPreview(resolveMediaUrl(content.profile.avatar || ""));
    setPosts(content.posts || []);
    setExperiences(content.experiences || []);
    setEducations(content.education || []);
    setCertificates(content.certificates || []);
    setProjects(content.projects || []);
    setExpertiseList(content.expertise || []);
  }, [content]);

  const login = async (event) => {
    event.preventDefault();
    try {
      setSaving("login");
      setMessage("");
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
      sessionStorage.setItem("portfolioAdminToken", result.token);
      setAdminToken(result.token);
      setPassword("");
      setMessage("Admin unlocked");
    } catch (err) {
      sessionStorage.removeItem("portfolioAdminToken");
      setAdminToken("");
      setMessage(err.message);
    } finally {
      setSaving("");
    }
  };

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    sessionStorage.removeItem("portfolioAdminToken");
    setAdminToken("");
    setMessage("Admin locked");
  };

  const saveProfile = async () => {
    if (!canSave) return setMessage("Admin login required");
    try {
      setSaving("profile");
      setMessage("");
      await api("/api/profile", { method: "PUT", body: JSON.stringify(profile) });
      await onRefresh();
      setMessage("Saved");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving("");
    }
  };

  const uploadAvatar = async (file) => {
    if (!file || !canSave) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setSaving("avatar");
        const result = await api("/api/profile/avatar", { method: "POST", body: JSON.stringify({ image: reader.result }) });
        setProfile((current) => ({ ...current, avatar: result.avatar }));
        setAvatarPreview(resolveMediaUrl(result.avatar));
        await onRefresh();
      } catch (err) {
        setMessage(err.message);
      } finally {
        setSaving("");
      }
    };
    reader.readAsDataURL(file);
  };

  // Generic Save and Delete
  const handleSave = async (draft, endpoint, setList, prefix) => {
    setSaving(`${prefix}-${draft.id || "new"}`);
    try {
      const isNew = isTemporaryId(draft.id);
      const payload = isNew ? { ...draft, id: undefined } : draft;
      const res = await api(isNew ? endpoint : `${endpoint}/${encodeURIComponent(draft.id)}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(payload)
      });
      setList((prev) => (isNew ? [res, ...prev.filter((item) => item.id !== draft.id)] : prev.map((item) => (item.id === res.id ? res : item))));
      await onRefresh();
      setMessage("Saved");
    } catch (err) {
      setMessage(err.message || "Error saving");
    } finally {
      setSaving("");
    }
  };

  const handleDelete = async (id, endpoint, setList, prefix) => {
    if (!id || !confirm("Delete this?")) return;
    setSaving(`${prefix}-delete-${id}`);
    try {
      if (isTemporaryId(id)) {
        setList((prev) => prev.filter((item) => item.id !== id));
        setMessage("Removed unsaved draft");
        return;
      }

      await api(`${endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" });
      setList((prev) => prev.filter((item) => item.id !== id));
      await onRefresh();
      setMessage("Deleted");
    } catch (err) {
      setMessage(err.message || "Error deleting");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <span>Editor</span>
          <h1>Portfolio backend</h1>
        </div>
        <div className="admin-actions">
          {!canEdit && <p className="save-message">Static GitHub Pages preview. Run locally to save edits.</p>}
          {canEdit && !adminToken && <p className="save-message">Admin locked</p>}
          {canEdit && adminToken && <p className="save-message">Admin unlocked</p>}
          {message && <p className="save-message">{message}</p>}
          {adminToken && (
            <button className="secondary-button" onClick={logout}>Lock admin</button>
          )}
          <button className="secondary-button" onClick={() => onNavigate("/")}>View site</button>
        </div>
      </header>

      <main className="admin-grid">
        {canEdit && !adminToken && (
          <section className="editor-panel wide-panel auth-panel">
            <div>
              <h2>Admin login</h2>
              <p>Enter your local admin password to edit content.</p>
            </div>
            <form className="auth-form" onSubmit={login}>
              <TextInput label="Admin password" type="password" value={password} onChange={setPassword} />
              <button className="primary-button" disabled={saving === "login"}>Unlock</button>
            </form>
          </section>
        )}

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Profile</h2>
            <button className="primary-button" onClick={saveProfile} disabled={!canSave || saving === "profile"}>
              <Save size={18} /> Save
            </button>
          </div>
          <div className="form-grid">
            <TextInput label="Name" value={profile.name} onChange={(name) => setProfile({ ...profile, name })} />
            <TextInput label="Role" value={profile.role} onChange={(role) => setProfile({ ...profile, role })} />
            <TextInput label="Location" value={profile.location} onChange={(location) => setProfile({ ...profile, location })} />
            <TextInput label="Email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} />
            <TextInput label="GitHub" value={profile.github} onChange={(github) => setProfile({ ...profile, github })} />
            <TextInput label="LinkedIn" value={profile.linkedin} onChange={(linkedin) => setProfile({ ...profile, linkedin })} />
            <TextInput label="Instagram" value={profile.instagram} onChange={(instagram) => setProfile({ ...profile, instagram })} />
            <div className="avatar-editor">
              <img src={avatarPreview || resolveMediaUrl(profile.avatar || "")} alt="" />
              <div>
                <TextInput label="Avatar URL" value={profile.avatar || ""} onChange={(avatar) => setProfile({ ...profile, avatar })} />
                <label className="file-field">
                  <span>Upload profile image</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
                </label>
              </div>
            </div>
            <TextArea label="Headline" value={profile.headline} onChange={(headline) => setProfile({ ...profile, headline })} />
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Page Headings & Descriptions</h2>
            <button className="primary-button" onClick={saveProfile} disabled={!canSave || saving === "profile"}>
              <Save size={18} /> Save
            </button>
          </div>
          <div className="form-grid">
            <TextInput label="Home - Projects Title" value={profile.headings?.homeProjectsTitle || ""} onChange={(v) => updateHeading("homeProjectsTitle", v)} />
            <TextInput label="Home - Projects Description" value={profile.headings?.homeProjectsDesc || ""} onChange={(v) => updateHeading("homeProjectsDesc", v)} />
            <TextInput label="Home - Updates Title" value={profile.headings?.homeUpdatesTitle || ""} onChange={(v) => updateHeading("homeUpdatesTitle", v)} />
            <TextInput label="Home - Updates Description" value={profile.headings?.homeUpdatesDesc || ""} onChange={(v) => updateHeading("homeUpdatesDesc", v)} />
            <TextInput label="Projects Page Title" value={profile.headings?.projectsTitle || ""} onChange={(v) => updateHeading("projectsTitle", v)} />
            <TextInput label="Projects Page Description" value={profile.headings?.projectsDesc || ""} onChange={(v) => updateHeading("projectsDesc", v)} />
            <TextInput label="Certificates Page Title" value={profile.headings?.certificatesTitle || ""} onChange={(v) => updateHeading("certificatesTitle", v)} />
            <TextInput label="Certificates Page Description" value={profile.headings?.certificatesDesc || ""} onChange={(v) => updateHeading("certificatesDesc", v)} />
            <TextInput label="Skills Page Title" value={profile.headings?.skillsTitle || ""} onChange={(v) => updateHeading("skillsTitle", v)} />
            <TextInput label="Skills Page Description" value={profile.headings?.skillsDesc || ""} onChange={(v) => updateHeading("skillsDesc", v)} />
            <TextInput label="Blog Page Title" value={profile.headings?.blogTitle || ""} onChange={(v) => updateHeading("blogTitle", v)} />
            <TextInput label="Blog Page Description" value={profile.headings?.blogDesc || ""} onChange={(v) => updateHeading("blogDesc", v)} />
            <TextInput label="About - Work History Title" value={profile.headings?.aboutExperienceTitle || ""} onChange={(v) => updateHeading("aboutExperienceTitle", v)} />
            <TextInput label="About - Education Title" value={profile.headings?.aboutEducationTitle || ""} onChange={(v) => updateHeading("aboutEducationTitle", v)} />
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>About page section</h2>
            <button className="primary-button" onClick={saveProfile} disabled={!canSave || saving === "profile"}>
              <Save size={18} /> Save
            </button>
          </div>
          <div className="form-grid">
            <TextArea label="Large title on About page" value={profile.aboutTitle || ""} onChange={(aboutTitle) => setProfile({ ...profile, aboutTitle })} />
            <TextArea label="About paragraph" value={profile.bio} onChange={(bio) => setProfile({ ...profile, bio })} />
            <TextArea label="Skill chips (comma separated)" value={profile.skills} onChange={(skills) => setProfile({ ...profile, skills })} />
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Expertise</h2>
            <button className="primary-button" onClick={() => setExpertiseList([{ ...blankExpertise, id: `temp-${Date.now()}` }, ...expertiseList])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {expertiseList.map((item) => (
              <EditableExpertise key={item.id} expertise={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/expertise", setExpertiseList, "expertise")} onDelete={(id) => handleDelete(id, "/api/expertise", setExpertiseList, "expertise")} saving={saving} />
            ))}
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Projects</h2>
            <button className="primary-button" onClick={() => setProjects([{ ...blankProject, id: `temp-${Date.now()}` }, ...projects])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {projects.map((item) => (
              <EditableProject key={item.id} project={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/projects", setProjects, "project")} onDelete={(id) => handleDelete(id, "/api/projects", setProjects, "project")} saving={saving} />
            ))}
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Certificates</h2>
            <button className="primary-button" onClick={() => setCertificates([{ ...blankCertificate, id: `temp-${Date.now()}` }, ...certificates])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {certificates.map((item) => (
              <EditableCertificate key={item.id} certificate={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/certificates", setCertificates, "certificate")} onDelete={(id) => handleDelete(id, "/api/certificates", setCertificates, "certificate")} saving={saving} />
            ))}
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Posts</h2>
            <button className="primary-button" onClick={() => setPosts([{ ...blankPost, id: `temp-${Date.now()}` }, ...posts])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {posts.map((item) => (
              <EditablePost key={item.id} post={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/posts", setPosts, "post")} onDelete={(id) => handleDelete(id, "/api/posts", setPosts, "post")} saving={saving} />
            ))}
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Experience</h2>
            <button className="primary-button" onClick={() => setExperiences([{ ...blankExperience, id: `temp-${Date.now()}` }, ...experiences])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {experiences.map((item) => (
              <EditableExperience key={item.id} experience={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/experiences", setExperiences, "exp")} onDelete={(id) => handleDelete(id, "/api/experiences", setExperiences, "exp")} saving={saving} />
            ))}
          </div>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Education</h2>
            <button className="primary-button" onClick={() => setEducations([{ ...blankEducation, id: `temp-${Date.now()}` }, ...educations])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="record-list">
            {educations.map((item) => (
              <EditableEducation key={item.id} education={item} canEdit={canSave} onSave={(draft) => handleSave(draft, "/api/education", setEducations, "edu")} onDelete={(id) => handleDelete(id, "/api/education", setEducations, "edu")} saving={saving} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function EditableExpertise({ expertise, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState({ ...expertise, skills: normalizeList(expertise.skills).join(", ") });
  useEffect(() => { setDraft({ ...expertise, skills: normalizeList(expertise.skills).join(", ") }); }, [expertise]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="Category" value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
        <TextArea label="Description" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <TextArea label="Skills (Comma separated)" value={draft.skills} onChange={(skills) => setDraft({ ...draft, skills })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `expertise-${draft.id}` || saving === `expertise-delete-${draft.id}`} />
    </article>
  );
}

function EditablePost({ post, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState({ ...post, mediaUrls: normalizeList(post.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...post, mediaUrls: normalizeList(post.mediaUrls).join(", ") }); }, [post]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextInput label="Category" value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
        <TextInput label="Date" type="date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
        <TextArea label="Summary" value={draft.summary} onChange={(summary) => setDraft({ ...draft, summary })} />
        <TextArea label="Full Content (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} />
        <TextInput label="Image URL" value={draft.imageUrl || ""} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
        <TextInput label="YouTube URL" value={draft.youtubeUrl || ""} onChange={(youtubeUrl) => setDraft({ ...draft, youtubeUrl })} />
        <TextInput label="External Link (Optional)" value={draft.externalUrl || ""} onChange={(externalUrl) => setDraft({ ...draft, externalUrl })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `post-${draft.id}` || saving === `post-delete-${draft.id}`} />
    </article>
  );
}

function EditableEducation({ education, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState({ ...education, skills: normalizeList(education.skills).join(", ") });
  useEffect(() => { setDraft({ ...education, skills: normalizeList(education.skills).join(", ") }); }, [education]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="School" value={draft.school || ""} onChange={(school) => setDraft({ ...draft, school })} />
        <TextInput label="Program" value={draft.program || ""} onChange={(program) => setDraft({ ...draft, program })} />
        <TextInput label="Period" value={draft.period || ""} onChange={(period) => setDraft({ ...draft, period })} />
        <TextInput label="Skills" value={draft.skills || ""} onChange={(skills) => setDraft({ ...draft, skills })} />
        <TextArea label="Description" value={draft.description || ""} onChange={(description) => setDraft({ ...draft, description })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `edu-${draft.id}` || saving === `edu-delete-${draft.id}`} />
    </article>
  );
}

function EditableCertificate({ certificate, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState({ ...certificate, skills: normalizeList(certificate.skills).join(", "), mediaUrls: normalizeList(certificate.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...certificate, skills: normalizeList(certificate.skills).join(", "), mediaUrls: normalizeList(certificate.mediaUrls).join(", ") }); }, [certificate]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="Title" value={draft.title || ""} onChange={(title) => setDraft({ ...draft, title })} />
        <TextInput label="Issuer" value={draft.issuer || ""} onChange={(issuer) => setDraft({ ...draft, issuer })} />
        <TextInput label="Date" type="date" value={draft.date || ""} onChange={(date) => setDraft({ ...draft, date })} />
        <TextInput label="Credential URL" value={draft.credentialUrl || ""} onChange={(credentialUrl) => setDraft({ ...draft, credentialUrl })} />
        <TextInput label="Image URL" value={draft.imageUrl || ""} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
        <TextInput label="Skills" value={draft.skills || ""} onChange={(skills) => setDraft({ ...draft, skills })} />
        <TextArea label="Description" value={draft.description || ""} onChange={(description) => setDraft({ ...draft, description })} />
        <TextArea label="Full Description (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `certificate-${draft.id}` || saving === `certificate-delete-${draft.id}`} />
    </article>
  );
}

function EditableProject({ project, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState({ ...project, skills: normalizeList(project.skills).join(", "), highlights: normalizeList(project.highlights).join(" | "), mediaUrls: normalizeList(project.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...project, skills: normalizeList(project.skills).join(", "), highlights: normalizeList(project.highlights).join(" | "), mediaUrls: normalizeList(project.mediaUrls).join(", ") }); }, [project]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="Title" value={draft.title || draft.name || ""} onChange={(title) => setDraft({ ...draft, title })} />
        <TextInput label="Language" value={draft.language || ""} onChange={(language) => setDraft({ ...draft, language })} />
        <TextInput label="Period" value={draft.period || ""} onChange={(period) => setDraft({ ...draft, period })} />
        <TextInput label="Associated" value={draft.associated || ""} onChange={(associated) => setDraft({ ...draft, associated })} />
        <TextInput label="Updated" value={draft.updated || ""} onChange={(updated) => setDraft({ ...draft, updated })} />
        <TextInput label="Repo URL" value={draft.repoUrl || ""} onChange={(repoUrl) => setDraft({ ...draft, repoUrl })} />
        <TextInput label="Live URL" value={draft.liveUrl || ""} onChange={(liveUrl) => setDraft({ ...draft, liveUrl })} />
        <TextInput label="Image URL" value={draft.imageUrl || ""} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
        <TextInput label="Featured Rank" value={draft.featuredRank ?? ""} onChange={(featuredRank) => setDraft({ ...draft, featuredRank })} />
        <TextInput label="Skills" value={draft.skills || ""} onChange={(skills) => setDraft({ ...draft, skills })} />
        <TextArea label="Description" value={draft.description || ""} onChange={(description) => setDraft({ ...draft, description })} />
        <TextArea label="Full Description (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} />
        <TextArea label="Highlights" value={draft.highlights || ""} onChange={(highlights) => setDraft({ ...draft, highlights })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `project-${draft.id}` || saving === `project-delete-${draft.id}`} />
    </article>
  );
}

function EditableExperience({ experience, canEdit, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState(experience);
  useEffect(() => { setDraft(experience); }, [experience]);
  return (
    <article className="record-card">
      <div className="record-fields">
        <TextInput label="Role" value={draft.role || ""} onChange={(role) => setDraft({ ...draft, role })} />
        <TextInput label="Company" value={draft.company || ""} onChange={(company) => setDraft({ ...draft, company })} />
        <TextInput label="Period" value={draft.period || ""} onChange={(period) => setDraft({ ...draft, period })} />
        <TextArea label="Description" value={draft.description || ""} onChange={(description) => setDraft({ ...draft, description })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `exp-${draft.id}` || saving === `exp-delete-${draft.id}`} />
    </article>
  );
}

function RecordActions({ onSave, onDelete, disabled }) {
  return (
    <div className="record-actions">
      <button className="icon-button" onClick={onSave} disabled={disabled} aria-label="Save record">
        <Save size={18} />
      </button>
      <button className="icon-button danger" onClick={onDelete} disabled={disabled} aria-label="Delete record">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}
