import { useState, useEffect, useRef } from "react";
import { Bold, Code2, Edit3, Heading2, Image as ImageIcon, Italic, Link as LinkIcon, List, Quote, Save, Trash2, Plus, GripVertical, Video, Youtube } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getUrlLabel, getYoutubeEmbedUrl, isImageUrl, resolveMediaUrl, normalizeList } from "../utils";

const blankPost = { title: "", category: "News", date: new Date().toISOString().slice(0, 10), summary: "", fullDescription: "", imageUrl: "", mediaUrls: "", youtubeUrl: "", externalUrl: "" };
const blankExperience = { role: "", company: "", period: "", description: "" };
const blankEducation = { school: "", program: "", period: "", description: "", skills: "" };
const blankCertificate = { title: "", issuer: "", date: "", credentialUrl: "", imageUrl: "", mediaUrls: "", description: "", fullDescription: "", skills: "" };
const blankProject = { title: "", description: "", fullDescription: "", language: "", repoUrl: "", liveUrl: "", imageUrl: "", mediaUrls: "", updated: "", period: "", associated: "", skills: "", highlights: "", featuredRank: "" };
const blankExpertise = { category: "", description: "", skills: "" };
const richContentHelp = "Cards in Media library show in the page gallery. Click a card to also place it in the text. Use the small text button to remove only from text, or the trash button to remove from the gallery.";

export const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

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

  const handleDragEnd = async (result, list, setList, sectionKey) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    
    const items = Array.from(list);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setList(items);
    
    try {
      const orderedIds = items.map(item => item.id);
      await api(`/api/reorder/${sectionKey}`, { method: "PUT", body: JSON.stringify({ orderedIds }) });
      await onRefresh();
      setMessage("Reordered successfully");
    } catch (err) {
      setMessage(err.message || "Error saving order");
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
          {!canEdit && <p className="save-message">Read-only preview. Add Vercel Blob storage or run locally to save edits.</p>}
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
              <p>Enter your admin password to edit content.</p>
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
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, expertiseList, setExpertiseList, "expertise")}>
            <StrictModeDroppable droppableId="expertise">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {expertiseList.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditableExpertise expertise={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/expertise", setExpertiseList, "expertise")} onDelete={(id) => handleDelete(id, "/api/expertise", setExpertiseList, "expertise")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Projects</h2>
            <button className="primary-button" onClick={() => setProjects([{ ...blankProject, id: `temp-${Date.now()}` }, ...projects])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, projects, setProjects, "projects")}>
            <StrictModeDroppable droppableId="projects">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {projects.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditableProject project={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/projects", setProjects, "project")} onDelete={(id) => handleDelete(id, "/api/projects", setProjects, "project")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Certificates</h2>
            <button className="primary-button" onClick={() => setCertificates([{ ...blankCertificate, id: `temp-${Date.now()}` }, ...certificates])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, certificates, setCertificates, "certificates")}>
            <StrictModeDroppable droppableId="certificates">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {certificates.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditableCertificate certificate={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/certificates", setCertificates, "certificate")} onDelete={(id) => handleDelete(id, "/api/certificates", setCertificates, "certificate")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Posts</h2>
            <button className="primary-button" onClick={() => setPosts([{ ...blankPost, id: `temp-${Date.now()}` }, ...posts])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, posts, setPosts, "posts")}>
            <StrictModeDroppable droppableId="posts">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {posts.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditablePost post={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/posts", setPosts, "post")} onDelete={(id) => handleDelete(id, "/api/posts", setPosts, "post")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Experience</h2>
            <button className="primary-button" onClick={() => setExperiences([{ ...blankExperience, id: `temp-${Date.now()}` }, ...experiences])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, experiences, setExperiences, "experiences")}>
            <StrictModeDroppable droppableId="experiences">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {experiences.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditableExperience experience={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/experiences", setExperiences, "exp")} onDelete={(id) => handleDelete(id, "/api/experiences", setExperiences, "exp")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

        <section className="editor-panel wide-panel">
          <div className="panel-title">
            <h2>Education</h2>
            <button className="primary-button" onClick={() => setEducations([{ ...blankEducation, id: `temp-${Date.now()}` }, ...educations])} disabled={!canSave}>
              <Plus size={18} /> Add
            </button>
          </div>
          <DragDropContext onDragEnd={(res) => handleDragEnd(res, educations, setEducations, "education")}>
            <StrictModeDroppable droppableId="education">
              {(provided) => (
                <div className="record-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {educations.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
                          <EditableEducation education={item} canEdit={canSave} dragHandleProps={provided.dragHandleProps} onSave={(draft) => handleSave(draft, "/api/education", setEducations, "edu")} onDelete={(id) => handleDelete(id, "/api/education", setEducations, "edu")} saving={saving} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>

      </main>
    </div>
  );
}

function EditableExpertise({ expertise, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState({ ...expertise, skills: normalizeList(expertise.skills).join(", ") });
  useEffect(() => { setDraft({ ...expertise, skills: normalizeList(expertise.skills).join(", ") }); }, [expertise]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
      <div className="record-fields">
        <TextInput label="Category" value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
        <TextArea label="Description" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <TextArea label="Skills (Comma separated)" value={draft.skills} onChange={(skills) => setDraft({ ...draft, skills })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `expertise-${draft.id}` || saving === `expertise-delete-${draft.id}`} />
    </article>
  );
}

function EditablePost({ post, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState({ ...post, mediaUrls: normalizeList(post.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...post, mediaUrls: normalizeList(post.mediaUrls).join(", ") }); }, [post]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
      <div className="record-fields">
        <TextInput label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextInput label="Category" value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
        <TextInput label="Date" type="date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
        <TextArea label="Summary" value={draft.summary} onChange={(summary) => setDraft({ ...draft, summary })} />
        <TextInput label="Image URL" value={draft.imageUrl || ""} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
        <TextInput label="YouTube URL" value={draft.youtubeUrl || ""} onChange={(youtubeUrl) => setDraft({ ...draft, youtubeUrl })} />
        <TextInput label="External Link (Optional)" value={draft.externalUrl || ""} onChange={(externalUrl) => setDraft({ ...draft, externalUrl })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
        <RichTextArea label="Full Content (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} mediaUrls={draft.mediaUrls} onMediaUrlsChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} youtubeUrl={draft.youtubeUrl} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `post-${draft.id}` || saving === `post-delete-${draft.id}`} />
    </article>
  );
}

function EditableEducation({ education, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState({ ...education, skills: normalizeList(education.skills).join(", ") });
  useEffect(() => { setDraft({ ...education, skills: normalizeList(education.skills).join(", ") }); }, [education]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
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

function EditableCertificate({ certificate, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState({ ...certificate, skills: normalizeList(certificate.skills).join(", "), mediaUrls: normalizeList(certificate.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...certificate, skills: normalizeList(certificate.skills).join(", "), mediaUrls: normalizeList(certificate.mediaUrls).join(", ") }); }, [certificate]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
      <div className="record-fields">
        <TextInput label="Title" value={draft.title || ""} onChange={(title) => setDraft({ ...draft, title })} />
        <TextInput label="Issuer" value={draft.issuer || ""} onChange={(issuer) => setDraft({ ...draft, issuer })} />
        <TextInput label="Date" type="date" value={draft.date || ""} onChange={(date) => setDraft({ ...draft, date })} />
        <TextInput label="Credential URL" value={draft.credentialUrl || ""} onChange={(credentialUrl) => setDraft({ ...draft, credentialUrl })} />
        <TextInput label="Image URL" value={draft.imageUrl || ""} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
        <TextInput label="Skills" value={draft.skills || ""} onChange={(skills) => setDraft({ ...draft, skills })} />
        <TextArea label="Description" value={draft.description || ""} onChange={(description) => setDraft({ ...draft, description })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
        <RichTextArea label="Full Description (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} mediaUrls={draft.mediaUrls} onMediaUrlsChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `certificate-${draft.id}` || saving === `certificate-delete-${draft.id}`} />
    </article>
  );
}

function EditableProject({ project, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState({ ...project, skills: normalizeList(project.skills).join(", "), highlights: normalizeList(project.highlights).join(" | "), mediaUrls: normalizeList(project.mediaUrls).join(", ") });
  useEffect(() => { setDraft({ ...project, skills: normalizeList(project.skills).join(", "), highlights: normalizeList(project.highlights).join(" | "), mediaUrls: normalizeList(project.mediaUrls).join(", ") }); }, [project]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
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
        <TextArea label="Highlights" value={draft.highlights || ""} onChange={(highlights) => setDraft({ ...draft, highlights })} />
        <TextInput label="Additional Media URLs (Comma separated)" value={draft.mediaUrls || ""} onChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
        <RichTextArea label="Full Description (Optional)" value={draft.fullDescription || ""} onChange={(fullDescription) => setDraft({ ...draft, fullDescription })} mediaUrls={draft.mediaUrls} onMediaUrlsChange={(mediaUrls) => setDraft({ ...draft, mediaUrls })} />
      </div>
      <RecordActions onSave={() => onSave(draft)} onDelete={() => onDelete(draft.id)} disabled={!canEdit || saving === `project-${draft.id}` || saving === `project-delete-${draft.id}`} />
    </article>
  );
}

function EditableExperience({ experience, canEdit, onSave, onDelete, saving, dragHandleProps }) {
  const [draft, setDraft] = useState(experience);
  useEffect(() => { setDraft(experience); }, [experience]);
  return (
    <article className="record-card">
      {dragHandleProps && (
        <div className="drag-handle" {...dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: canEdit ? "grab" : "default", opacity: canEdit ? 1 : 0.3 }}>
          <GripVertical size={20} />
        </div>
      )}
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

function buildMediaDirective(type, url, caption = "") {
  const cleanUrl = String(url || "").trim();
  const cleanCaption = String(caption || "").trim();
  return `[${type}: ${cleanUrl}${cleanCaption ? ` | ${cleanCaption}` : ""}]`;
}

function getYoutubeThumbnail(url) {
  const embedUrl = getYoutubeEmbedUrl(url);
  const match = embedUrl.match(/\/embed\/([^?]+)/);
  return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
}

function getMediaPreviewType(url) {
  if (getYoutubeEmbedUrl(url)) return "youtube";
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url || "")) return "video";
  if (isImageUrl(url)) return "image";
  return "link";
}

function splitEditorValueAndCaption(value = "") {
  const [urlPart, ...captionParts] = String(value).split("|");
  return {
    url: urlPart.trim(),
    caption: captionParts.join("|").trim()
  };
}

function parseInlineEditorMedia(text = "", mediaList = []) {
  const blocks = [];

  String(text || "").split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const markdownImage = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (markdownImage) {
      blocks.push({
        url: markdownImage[2].trim(),
        caption: markdownImage[1].trim(),
        lineIndex,
        label: `Inline image ${blocks.length + 1}`,
        type: "image"
      });
      return;
    }

    const directive = trimmed.match(/^\[(media|image|video|youtube|link):\s*(.+)\]$/i);
    if (directive) {
      const directiveType = directive[1].toLowerCase();
      const { url: rawUrl, caption } = splitEditorValueAndCaption(directive[2]);
      const mediaNumber = directiveType === "media" ? Number(rawUrl) : null;
      const url = directiveType === "media" ? mediaList[mediaNumber - 1] || "" : rawUrl;
      if (!url) return;
      blocks.push({
        url,
        caption,
        lineIndex,
        galleryIndex: directiveType === "media" && Number.isFinite(mediaNumber) ? mediaNumber - 1 : null,
        label: directiveType === "media" ? `Media ${mediaNumber}` : `Inline ${directiveType} ${blocks.length + 1}`,
        type: directiveType === "media" ? getMediaPreviewType(url) : directiveType
      });
      return;
    }

    const isStandaloneMedia = getYoutubeEmbedUrl(trimmed) || /\.(mp4|webm|ogg|avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i.test(trimmed);
    if (isStandaloneMedia) {
      blocks.push({
        url: trimmed,
        caption: "",
        lineIndex,
        label: `Inline media ${blocks.length + 1}`,
        type: getMediaPreviewType(trimmed)
      });
    }
  });

  return blocks;
}

function MediaPreviewCard({ url, index, onInsert, onRemove, onUnplace, label, typeOverride, isPlaced = false }) {
  const type = typeOverride || getMediaPreviewType(url);
  const resolvedUrl = resolveMediaUrl(url);
  const youtubeThumb = type === "youtube" ? getYoutubeThumbnail(url) : "";
  const cardLabel = label || `Media ${index + 1}`;

  return (
    <div className={`rich-editor-media-card${isPlaced ? " is-placed" : ""}`} title={url}>
      <button type="button" className="rich-editor-media-insert" onClick={onInsert} aria-label={`Insert ${cardLabel}`}>
        <span className="rich-editor-preview">
          {type === "image" && <img src={resolvedUrl} alt="" loading="lazy" />}
          {type === "youtube" && youtubeThumb && <img src={youtubeThumb} alt="" loading="lazy" />}
          {type === "video" && <video src={resolvedUrl} muted preload="metadata" />}
          {type === "link" && <LinkIcon size={22} />}
        </span>
        <span className="rich-editor-media-meta">
          <strong>{cardLabel}</strong>
          <small>{isPlaced ? "Placed in text" : type === "link" ? getUrlLabel(url) : type}</small>
        </span>
      </button>
      {onRemove && (
        <button type="button" className="rich-editor-media-remove" onClick={onRemove} aria-label={`Remove ${cardLabel}`}>
          <Trash2 size={14} />
        </button>
      )}
      {isPlaced && onUnplace && (
        <button type="button" className="rich-editor-media-unplace" onClick={onUnplace}>
          Remove from text
        </button>
      )}
    </div>
  );
}

function RichTextArea({ label, value, onChange, mediaUrls = "", onMediaUrlsChange, youtubeUrl = "" }) {
  const textareaRef = useRef(null);
  const mediaList = normalizeList(mediaUrls);
  const inlineBlocks = parseInlineEditorMedia(value, mediaList);
  const placedGalleryIndexes = new Set(
    inlineBlocks
      .map((block) => block.galleryIndex)
      .filter((index) => Number.isInteger(index) && index >= 0)
  );
  const manualInlineBlocks = inlineBlocks.filter((block) => !Number.isInteger(block.galleryIndex));

  const insertBlock = (block) => {
    const current = value || "";
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const prefix = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const suffix = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "\n\n";
    const nextValue = `${before}${prefix}${block}${suffix}${after}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      const cursor = `${before}${prefix}${block}`.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const removeMedia = (removeIndex) => {
    if (!onMediaUrlsChange) return;

    const nextMediaList = mediaList.filter((_, index) => index !== removeIndex);
    const nextContent = String(value || "")
      .split(/\r?\n/)
      .map((line) => {
        const match = line.trim().match(/^\[media:\s*(\d+)(\s*\|[^\]]*)?\]$/i);
        if (!match) return line;

        const mediaNumber = Number(match[1]);
        const caption = match[2] || "";
        if (mediaNumber === removeIndex + 1) return "";
        if (mediaNumber > removeIndex + 1) return `[media: ${mediaNumber - 1}${caption}]`;
        return line;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    onMediaUrlsChange(nextMediaList.join(", "));
    onChange(nextContent);
  };

  const removeInlineBlock = (lineIndex) => {
    const nextContent = String(value || "")
      .split(/\r?\n/)
      .filter((_, index) => index !== lineIndex)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    onChange(nextContent);
  };

  const removeGalleryMediaFromText = (galleryIndex) => {
    const nextContent = String(value || "")
      .split(/\r?\n/)
      .filter((line) => {
        const match = line.trim().match(/^\[media:\s*(\d+)(\s*\|[^\]]*)?\]$/i);
        return !match || Number(match[1]) !== galleryIndex + 1;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    onChange(nextContent);
  };

  const promptAndInsert = (type) => {
    const labels = {
      image: "Image URL",
      youtube: "YouTube URL",
      video: "Video URL",
      link: "Link URL"
    };
    const url = window.prompt(labels[type] || "URL");
    if (!url) return;
    const caption = window.prompt(type === "link" ? "Link label (optional)" : "Caption (optional)") || "";
    insertBlock(buildMediaDirective(type, url, caption));
  };

  const wrapSelection = (startMarker, endMarker = startMarker, fallback = "text") => {
    const current = value || "";
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || fallback;
    const nextValue = `${current.slice(0, start)}${startMarker}${selected}${endMarker}${current.slice(end)}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      const selectionStart = start + startMarker.length;
      const selectionEnd = selectionStart + selected.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const prefixSelectionLines = (prefix, fallback = "Text") => {
    const current = value || "";
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || fallback;
    const replacement = selected
      .split(/\r?\n/)
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const nextValue = `${current.slice(0, start)}${replacement}${current.slice(end)}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, start + replacement.length);
    });
  };

  return (
    <label className="field rich-editor-field">
      <span>{label}</span>
      <textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} rows={10} />
      <div className="rich-editor-toolbar" aria-label="Inline media tools">
        <div className="rich-editor-formatbar">
          <button type="button" className="rich-editor-button square" title="Bold" onClick={() => wrapSelection("**", "**", "bold text")}>
            <Bold size={16} />
          </button>
          <button type="button" className="rich-editor-button square" title="Italic" onClick={() => wrapSelection("*", "*", "italic text")}>
            <Italic size={16} />
          </button>
          <button type="button" className="rich-editor-button square" title="Heading" onClick={() => prefixSelectionLines("## ", "Heading")}>
            <Heading2 size={16} />
          </button>
          <button type="button" className="rich-editor-button square" title="Bullet list" onClick={() => prefixSelectionLines("- ", "List item")}>
            <List size={16} />
          </button>
          <button type="button" className="rich-editor-button square" title="Quote" onClick={() => prefixSelectionLines("> ", "Quote")}>
            <Quote size={16} />
          </button>
          <button type="button" className="rich-editor-button square" title="Inline code" onClick={() => wrapSelection("`", "`", "code")}>
            <Code2 size={16} />
          </button>
        </div>
        <div className="rich-editor-group">
          <button type="button" className="rich-editor-button" onClick={() => promptAndInsert("image")}><ImageIcon size={15} /> Image</button>
          <button type="button" className="rich-editor-button" onClick={() => promptAndInsert("youtube")}><Youtube size={15} /> YouTube</button>
          <button type="button" className="rich-editor-button" onClick={() => promptAndInsert("video")}><Video size={15} /> Video</button>
          <button type="button" className="rich-editor-button" onClick={() => promptAndInsert("link")}><LinkIcon size={15} /> Link</button>
          {youtubeUrl && (
            <button type="button" className="rich-editor-button accent" onClick={() => insertBlock(buildMediaDirective("youtube", youtubeUrl))}>
              Use YouTube URL
            </button>
          )}
        </div>
        {(mediaList.length > 0 || manualInlineBlocks.length > 0) && (
          <div className="rich-editor-media-strip">
            <span>Media library</span>
            <div className="rich-editor-media-grid">
              {mediaList.map((url, index) => (
                <MediaPreviewCard
                  key={`${url}-${index}`}
                  url={url}
                  index={index}
                  isPlaced={placedGalleryIndexes.has(index)}
                  onInsert={() => insertBlock(`[media: ${index + 1}]`)}
                  onRemove={() => removeMedia(index)}
                  onUnplace={() => removeGalleryMediaFromText(index)}
                />
              ))}
              {manualInlineBlocks.map((block) => (
                <MediaPreviewCard
                  key={`${block.lineIndex}-${block.url}`}
                  url={block.url}
                  index={block.lineIndex}
                  label={block.caption || block.label}
                  typeOverride={block.type}
                  isPlaced
                  onInsert={() => {
                    textareaRef.current?.focus();
                    const lines = String(value || "").split(/\r?\n/);
                    const cursor = lines.slice(0, block.lineIndex + 1).join("\n").length;
                    textareaRef.current?.setSelectionRange(cursor, cursor);
                  }}
                  onRemove={() => removeInlineBlock(block.lineIndex)}
                />
              ))}
            </div>
          </div>
        )}
        <small className="field-help rich-editor-note">{richContentHelp}</small>
      </div>
    </label>
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

function TextArea({ label, value, onChange, help, rows = 4 }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
      {help && <small className="field-help">{help}</small>}
    </label>
  );
}
