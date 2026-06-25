import express from "express";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { get, put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "content.json");
const distPath = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const envPaths = [path.join(rootDir, ".env"), path.join(rootDir, ".env.local")];
const contentBlobPath = "portfolio/content.json";

for (const envPath of envPaths) {
  if (!existsSync(envPath)) continue;
  const envLines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of envLines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const port = Number(process.env.PORT || 3001);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || adminPassword || crypto.randomBytes(32).toString("hex");
const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const hasBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const app = express();
app.use(express.json({ limit: "12mb" }));

async function readContent() {
  if (hasBlobStorage) {
    try {
      const blob = await get(contentBlobPath);
      const raw = await new Response(blob.stream()).text();
      return JSON.parse(raw);
    } catch (error) {
      if (error?.status !== 404 && error?.statusCode !== 404) {
        console.warn("Falling back to bundled content because Vercel Blob read failed:", error.message);
      }
    }
  }

  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

async function writeContent(content) {
  if (hasBlobStorage) {
    await put(contentBlobPath, `${JSON.stringify(content, null, 2)}\n`, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return;
  }

  if (isVercelRuntime) {
    throw new Error("Persistent editing on Vercel requires Vercel Blob. Add BLOB_READ_WRITE_TOKEN in your Vercel environment variables.");
  }

  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function sortByUpdatedDesc(items) {
  return [...items].sort((a, b) => {
    const rankA = a.featuredRank === "" || a.featuredRank == null ? 999 : Number(a.featuredRank);
    const rankB = b.featuredRank === "" || b.featuredRank == null ? 999 : Number(b.featuredRank);
    return rankA - rankB || String(b.updated || "").localeCompare(String(a.updated || ""));
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value || "")
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + 1000 * 60 * 60 * 12,
    nonce: crypto.randomBytes(16).toString("hex")
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", adminSessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;

  const expected = crypto.createHmac("sha256", adminSessionSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (verifySessionToken(token)) {
    return next();
  }

  return res.status(401).json({ message: "Admin login required." });
}

app.get("/api/content", async (_req, res, next) => {
  try {
    const content = await readContent();
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Lets the frontend know it's talking to a live local server (not static GitHub Pages).
app.get("/api/auth/status", (_req, res) => {
  res.json({
    canEdit: !isVercelRuntime || hasBlobStorage,
    runtime: isVercelRuntime ? "vercel" : "local",
    storage: hasBlobStorage ? "vercel-blob" : "local-file"
  });
});

app.post("/api/auth/login", (req, res) => {
  if (!adminPassword) {
    return res.status(503).json({ message: "ADMIN_PASSWORD is not configured." });
  }

  if (String(req.body.password || "") !== adminPassword) {
    return res.status(401).json({ message: "Incorrect admin password." });
  }

  res.json({ token: createSessionToken() });
});

app.post("/api/auth/logout", requireAdmin, (req, res) => {
  res.status(204).end();
});

app.put("/api/profile", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    content.profile = {
      ...content.profile,
      ...req.body,
      skills: Array.isArray(req.body.skills)
        ? req.body.skills
        : String(req.body.skills || "")
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
    };
    await writeContent(content);
    res.json(content.profile);
  } catch (error) {
    next(error);
  }
});

app.put("/api/reorder/:section", requireAdmin, async (req, res, next) => {
  try {
    const { section } = req.params;
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }

    const content = await readContent();
    const list = content[section];
    
    if (!Array.isArray(list)) {
      return res.status(400).json({ message: "Invalid section or section is not a list" });
    }

    // Map existing items to a dictionary for quick lookup
    const itemMap = new Map(list.map(item => [item.id, item]));
    
    // Create new array based on orderedIds, keeping any remaining items at the end
    const reorderedList = [];
    const usedIds = new Set();

    for (const id of orderedIds) {
      if (itemMap.has(id)) {
        reorderedList.push(itemMap.get(id));
        usedIds.add(id);
      }
    }

    // Add any items that were not in the orderedIds (just in case)
    for (const item of list) {
      if (!usedIds.has(item.id)) {
        reorderedList.push(item);
      }
    }

    content[section] = reorderedList;
    await writeContent(content);
    res.json(content[section]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/profile/avatar", requireAdmin, async (req, res, next) => {
  try {
    const match = String(req.body.image || "").match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ message: "Upload a PNG, JPG, or WebP image." });
    }

    const extension = match[1].includes("png") ? "png" : match[1].includes("webp") ? "webp" : "jpg";
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ message: "Image must be smaller than 8 MB." });
    }

    const fileName = `profile-photo-${Date.now()}.${extension}`;
    let avatar = fileName;

    if (hasBlobStorage) {
      const blob = await put(`portfolio/uploads/${fileName}`, buffer, {
        access: "public",
        contentType: match[1]
      });
      avatar = blob.url;
    } else {
      if (isVercelRuntime) {
        throw new Error("Image uploads on Vercel require Vercel Blob. Add BLOB_READ_WRITE_TOKEN in your Vercel environment variables.");
      }

      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, fileName), buffer);
    }

    const content = await readContent();
    content.profile = {
      ...content.profile,
      avatar
    };
    await writeContent(content);
    res.status(201).json({ avatar });
  } catch (error) {
    next(error);
  }
});

app.post("/api/posts", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const post = {
      id: crypto.randomUUID(),
      title: String(req.body.title || "Untitled update"),
      category: String(req.body.category || "News"),
      date: String(req.body.date || new Date().toISOString().slice(0, 10)),
      summary: String(req.body.summary || ""),
      fullDescription: String(req.body.fullDescription || ""),
      imageUrl: String(req.body.imageUrl || ""),
      youtubeUrl: String(req.body.youtubeUrl || ""),
      externalUrl: String(req.body.externalUrl || ""),
      mediaUrls: normalizeList(req.body.mediaUrls)
    };
    content.posts = [post, ...(content.posts || [])];
    await writeContent(content);
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

app.put("/api/posts/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.posts || []).findIndex((post) => post.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Post not found" });
    }
    content.posts[index] = {
      ...content.posts[index],
      title: String(req.body.title || content.posts[index].title),
      category: String(req.body.category || content.posts[index].category),
      date: String(req.body.date || content.posts[index].date),
      summary: String(req.body.summary || content.posts[index].summary),
      fullDescription: String(req.body.fullDescription ?? content.posts[index].fullDescription ?? ""),
      imageUrl: String(req.body.imageUrl ?? content.posts[index].imageUrl ?? ""),
      youtubeUrl: String(req.body.youtubeUrl ?? content.posts[index].youtubeUrl ?? ""),
      externalUrl: String(req.body.externalUrl ?? content.posts[index].externalUrl ?? ""),
      mediaUrls: normalizeList(req.body.mediaUrls ?? content.posts[index].mediaUrls ?? [])
    };
    await writeContent(content);
    res.json(content.posts[index]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const project = {
      id: crypto.randomUUID(),
      name: String(req.body.name || req.body.title || "New Project"),
      description: String(req.body.description || ""),
      fullDescription: String(req.body.fullDescription || ""),
      language: String(req.body.language || ""),
      repoUrl: String(req.body.repoUrl || ""),
      liveUrl: String(req.body.liveUrl || ""),
      imageUrl: String(req.body.imageUrl || ""),
      mediaUrls: normalizeList(req.body.mediaUrls),
      updated: String(req.body.updated || new Date().toISOString().slice(0, 10)),
      featuredRank: req.body.featuredRank === "" ? "" : Number(req.body.featuredRank ?? 999),
      period: String(req.body.period || ""),
      associated: String(req.body.associated || ""),
      skills: normalizeList(req.body.skills),
      highlights: normalizeList(req.body.highlights)
    };
    content.projects = [project, ...(content.projects || [])];
    await writeContent(content);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.projects || []).findIndex((project) => project.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Project not found" });
    }
    content.projects[index] = {
      ...content.projects[index],
      name: String(req.body.name || req.body.title || content.projects[index].name),
      description: String(req.body.description ?? content.projects[index].description ?? ""),
      fullDescription: String(req.body.fullDescription ?? content.projects[index].fullDescription ?? ""),
      language: String(req.body.language ?? content.projects[index].language ?? ""),
      repoUrl: String(req.body.repoUrl ?? content.projects[index].repoUrl ?? ""),
      liveUrl: String(req.body.liveUrl ?? content.projects[index].liveUrl ?? ""),
      imageUrl: String(req.body.imageUrl ?? content.projects[index].imageUrl ?? ""),
      mediaUrls: normalizeList(req.body.mediaUrls ?? content.projects[index].mediaUrls ?? []),
      updated: String(req.body.updated || content.projects[index].updated),
      featuredRank: req.body.featuredRank === "" ? "" : Number(req.body.featuredRank ?? content.projects[index].featuredRank ?? 999),
      period: String(req.body.period ?? content.projects[index].period ?? ""),
      associated: String(req.body.associated ?? content.projects[index].associated ?? ""),
      skills: normalizeList(req.body.skills ?? content.projects[index].skills ?? []),
      highlights: normalizeList(req.body.highlights ?? content.projects[index].highlights ?? [])
    };
    await writeContent(content);
    res.json(content.projects[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const projects = content.projects || [];
    const nextProjects = projects.filter((project) => project.id !== req.params.id);
    if (nextProjects.length === projects.length) {
      return res.status(404).json({ message: "Project not found" });
    }
    content.projects = nextProjects;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete("/api/posts/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const posts = content.posts || [];
    const nextPosts = posts.filter((post) => post.id !== req.params.id);
    if (nextPosts.length === posts.length) {
      return res.status(404).json({ message: "Post not found" });
    }
    content.posts = nextPosts;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/certificates", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const certificate = {
      id: crypto.randomUUID(),
      title: String(req.body.title || "New Certificate"),
      issuer: String(req.body.issuer || ""),
      date: String(req.body.date || new Date().toISOString().slice(0, 10)),
      credentialUrl: String(req.body.credentialUrl || ""),
      imageUrl: String(req.body.imageUrl || ""),
      description: String(req.body.description || ""),
      fullDescription: String(req.body.fullDescription || ""),
      mediaUrls: normalizeList(req.body.mediaUrls),
      skills: normalizeList(req.body.skills)
    };
    content.certificates = [certificate, ...(content.certificates || [])];
    await writeContent(content);
    res.status(201).json(certificate);
  } catch (error) {
    next(error);
  }
});

app.put("/api/certificates/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.certificates || []).findIndex((certificate) => certificate.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    content.certificates[index] = {
      ...content.certificates[index],
      title: String(req.body.title || content.certificates[index].title),
      issuer: String(req.body.issuer ?? content.certificates[index].issuer ?? ""),
      date: String(req.body.date || content.certificates[index].date),
      credentialUrl: String(req.body.credentialUrl ?? content.certificates[index].credentialUrl ?? ""),
      imageUrl: String(req.body.imageUrl ?? content.certificates[index].imageUrl ?? ""),
      description: String(req.body.description ?? content.certificates[index].description ?? ""),
      fullDescription: String(req.body.fullDescription ?? content.certificates[index].fullDescription ?? ""),
      mediaUrls: normalizeList(req.body.mediaUrls ?? content.certificates[index].mediaUrls ?? []),
      skills: normalizeList(req.body.skills ?? content.certificates[index].skills ?? [])
    };
    await writeContent(content);
    res.json(content.certificates[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/certificates/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const certificates = content.certificates || [];
    const nextCertificates = certificates.filter((certificate) => certificate.id !== req.params.id);
    if (nextCertificates.length === certificates.length) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    content.certificates = nextCertificates;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/experiences", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const experience = {
      id: crypto.randomUUID(),
      role: String(req.body.role || "New Role"),
      company: String(req.body.company || "Company"),
      period: String(req.body.period || "Present"),
      description: String(req.body.description || "")
    };
    content.experiences = [experience, ...(content.experiences || [])];
    await writeContent(content);
    res.status(201).json(experience);
  } catch (error) {
    next(error);
  }
});

app.put("/api/experiences/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.experiences || []).findIndex((experience) => experience.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Experience not found" });
    }
    content.experiences[index] = {
      ...content.experiences[index],
      role: String(req.body.role || content.experiences[index].role),
      company: String(req.body.company || content.experiences[index].company),
      period: String(req.body.period || content.experiences[index].period),
      description: String(req.body.description || content.experiences[index].description)
    };
    await writeContent(content);
    res.json(content.experiences[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/experiences/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const experiences = content.experiences || [];
    const nextExperiences = experiences.filter((experience) => experience.id !== req.params.id);
    if (nextExperiences.length === experiences.length) {
      return res.status(404).json({ message: "Experience not found" });
    }
    content.experiences = nextExperiences;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/education", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const education = {
      id: crypto.randomUUID(),
      school: String(req.body.school || "School"),
      program: String(req.body.program || ""),
      period: String(req.body.period || "Present"),
      description: String(req.body.description || ""),
      skills: normalizeList(req.body.skills)
    };
    content.education = [education, ...(content.education || [])];
    await writeContent(content);
    res.status(201).json(education);
  } catch (error) {
    next(error);
  }
});

app.put("/api/education/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.education || []).findIndex((education) => education.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Education item not found" });
    }
    content.education[index] = {
      ...content.education[index],
      school: String(req.body.school || content.education[index].school),
      program: String(req.body.program ?? content.education[index].program ?? ""),
      period: String(req.body.period || content.education[index].period),
      description: String(req.body.description ?? content.education[index].description ?? ""),
      skills: normalizeList(req.body.skills ?? content.education[index].skills ?? [])
    };
    await writeContent(content);
    res.json(content.education[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/education/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const education = content.education || [];
    const nextEducation = education.filter((educationItem) => educationItem.id !== req.params.id);
    if (nextEducation.length === education.length) {
      return res.status(404).json({ message: "Education item not found" });
    }
    content.education = nextEducation;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/expertise", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const expertiseItem = {
      id: crypto.randomUUID(),
      category: String(req.body.category || "New Category"),
      description: String(req.body.description || ""),
      skills: normalizeList(req.body.skills)
    };
    content.expertise = [...(content.expertise || []), expertiseItem];
    await writeContent(content);
    res.status(201).json(expertiseItem);
  } catch (error) {
    next(error);
  }
});

app.put("/api/expertise/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.expertise || []).findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Expertise category not found" });
    }
    content.expertise[index] = {
      ...content.expertise[index],
      category: String(req.body.category || content.expertise[index].category),
      description: String(req.body.description ?? content.expertise[index].description ?? ""),
      skills: normalizeList(req.body.skills ?? content.expertise[index].skills ?? [])
    };
    await writeContent(content);
    res.json(content.expertise[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/expertise/:id", requireAdmin, async (req, res, next) => {
  try {
    const content = await readContent();
    const expertise = content.expertise || [];
    const nextExpertise = expertise.filter((item) => item.id !== req.params.id);
    if (nextExpertise.length === expertise.length) {
      return res.status(404).json({ message: "Expertise category not found" });
    }
    content.expertise = nextExpertise;
    await writeContent(content);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distPath));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = String(error?.message || "");
  res.status(500).json({
    message: message.includes("Vercel Blob")
      ? message
      : "Something went wrong while saving your portfolio."
  });
});

if (!isVercelRuntime) {
  app.listen(port, "127.0.0.1", () => {
    console.log(`Portfolio backend running on http://127.0.0.1:${port}`);
  });
}

export default app;
