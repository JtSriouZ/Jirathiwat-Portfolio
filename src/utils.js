export function getYoutubeEmbedUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
    if (parsed.pathname.includes("/shorts/")) {
      return `https://www.youtube.com/embed/${parsed.pathname.split("/shorts/")[1].split("/")[0]}`;
    }
    if (parsed.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    if (parsed.pathname.includes("/embed/")) {
      return url;
    }
  } catch {
    return "";
  }
  return "";
}

export function normalizeList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^(https?:|data:|blob:|\/)/.test(url)) {
    return url;
  }
  const baseUrl = import.meta.env?.BASE_URL || "/";
  return `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, "$1");
}

export function triggerGoogleTranslate(languageCode) {
  document.cookie = `googtrans=/en/${languageCode}; path=/;`;
  document.cookie = `googtrans=/en/${languageCode}; path=/; domain=${window.location.hostname};`;
  window.location.reload();
  return true;
}

function skillIconUrl(fileName) {
  return `https://cdn.jsdelivr.net/gh/tandpfun/skill-icons/icons/${fileName}.svg`;
}

function faviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

export function getSkillIconUrl(skillName) {
  const normalized = skillName.toLowerCase().trim();
  const aliases = {
    "react": "react.js",
    "next": "next.js",
    "vue": "vue.js",
    "tailwind": "tailwind css",
    "css": "css3",
    "html": "html5",
    "js": "javascript",
    "ts": "typescript",
    "node": "node.js",
    "express": "express.js",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "google cloud": "gcp",
    "amazon web services": "aws",
    "premiere pro": "adobe premiere pro",
    "photoshop": "adobe photoshop",
    "lightroom": "adobe lightroom",
    "visual studio code": "vs code",
    "vscode": "vs code",
    "npm": "npm",
    "openai api": "openai",
    "google ai studio": "gemini",
    "v0": "v0",
    "bolt.new": "bolt",
    "socketio": "socket.io",
    "socket io": "socket.io",
    "three": "three.js",
    "framer": "framer motion",
    "fusion360": "fusion 360",
    "obs": "obs studio"
  };
  const key = aliases[normalized] || normalized;
  const conceptualSkills = new Set([
    "artificial intelligence",
    "computer vision",
    "customer satisfaction",
    "data science",
    "full-stack development",
    "image & video editing",
    "operating systems",
    "programming",
    "real-time systems",
    "recommendation systems",
    "responsive design",
    "sales",
    "server & networking",
    "software engineering",
    "unit testing",
    "web applications"
  ]);

  if (conceptualSkills.has(key)) {
    return "";
  }
  
  const deviconUrls = {
    "python": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
    "pytorch": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg",
    "tensorflow": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
    "scikit-learn": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg",
    "pandas": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg",
    "numpy": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg",
    "opencv": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opencv/opencv-original.svg",
    "jupyter": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jupyter/jupyter-original.svg",
    "keras": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/keras/keras-original.svg",
    "matplotlib": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matplotlib/matplotlib-original.svg",
    "plotly": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/plotly/plotly-original.svg",
    "seaborn": faviconUrl("seaborn.pydata.org"),
    "scipy": "https://scipy.org/images/logo.svg",
    "streamlit": "https://streamlit.io/images/brand/streamlit-logo-primary-colormark-darktext.svg",
    "transformers": "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    "sentence transformers": "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    "deep learning": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
    "generative ai": "",
    "mlops": faviconUrl("mlflow.org"),
    "langchain": faviconUrl("langchain.com"),
    "openai": faviconUrl("openai.com"),
    "google colab": faviconUrl("colab.research.google.com"),
    "roboflow": faviconUrl("roboflow.com"),
    "ultralytics": "https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg",
    "java": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
    "c": skillIconUrl("C"),
    "c++": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg",
    "c/c++": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg",
    "git": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
    "github": skillIconUrl("Github-Dark"),
    "docker": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
    "linux": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg",
    "windows": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows11/windows11-original.svg",
    "windows server": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows11/windows11-original.svg",
    "wsl": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg",
    "bash": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg",
    "powershell": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/powershell/powershell-original.svg",
    "vs code": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg",
    "npm": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original-wordmark.svg",
    "github actions": skillIconUrl("GithubActions-Dark"),
    "ci/cd": skillIconUrl("GithubActions-Dark"),
    "vercel": skillIconUrl("Vercel-Dark"),
    "netlify": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/netlify/netlify-original.svg",
    "kubernetes": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg",
    "gcp": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    "aws": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
    "node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
    "express.js": skillIconUrl("ExpressJS-Dark"),
    "fastapi": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg",
    "restful apis": skillIconUrl("Postman"),
    "graphql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain.svg",
    "mongodb": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
    "postgresql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
    "mysql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg",
    "sql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
    "redis": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-plain.svg",
    "firebase": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg",
    "supabase": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg",
    "prisma": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg",
    "sqlite": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg",
    "nginx": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nginx/nginx-original.svg",
    "heroku": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/heroku/heroku-original.svg",
    "postman": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postman/postman-original.svg",
    "html5": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
    "css3": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
    "javascript": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
    "typescript": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
    "react.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
    "next.js": skillIconUrl("NextJS-Dark"),
    "vue.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg",
    "vite": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vite/vite-original.svg",
    "tailwind css": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
    "bootstrap": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bootstrap/bootstrap-original.svg",
    "sass": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg",
    "redux": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redux/redux-original.svg",
    "figma": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg",
    "framer motion": faviconUrl("framer.com"),
    "gsap": faviconUrl("gsap.com"),
    "three.js": skillIconUrl("ThreeJS-Dark"),
    "react router": faviconUrl("reactrouter.com"),
    "lucide": faviconUrl("lucide.dev"),
    "chart.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chartjs/chartjs-original.svg",
    "canva": faviconUrl("canva.com"),
    "webgl": "https://upload.wikimedia.org/wikipedia/commons/2/25/WebGL_Logo.svg",
    "ui/ux": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg",
    "object-oriented design": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
    "data structures": "",
    "algorithms": "",
    "system design": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg",
    "adobe photoshop": skillIconUrl("Photoshop"),
    "adobe premiere pro": skillIconUrl("Premiere"),
    "adobe illustrator": skillIconUrl("Illustrator"),
    "adobe after effects": skillIconUrl("AfterEffects"),
    "davinci resolve": faviconUrl("blackmagicdesign.com/products/davinciresolve"),
    "adobe lightroom": faviconUrl("adobe.com/products/photoshop-lightroom.html"),
    "chatgpt": faviconUrl("chatgpt.com"),
    "claude": faviconUrl("claude.ai"),
    "claude code": faviconUrl("claude.ai"),
    "gemini": faviconUrl("gemini.google.com"),
    "codex": faviconUrl("openai.com"),
    "antigravity": faviconUrl("deepmind.google"),
    "ubuntu": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg",
    "github copilot": faviconUrl("github.com/features/copilot"),
    "cursor": faviconUrl("cursor.com"),
    "perplexity": faviconUrl("perplexity.ai"),
    "anthropic": faviconUrl("anthropic.com"),
    "v0": faviconUrl("v0.dev"),
    "bolt": faviconUrl("bolt.new"),
    "replit": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/replit/replit-original.svg",
    "blender": skillIconUrl("Blender-Dark"),
    "midjourney": faviconUrl("midjourney.com"),
    "shapr3d": faviconUrl("shapr3d.com"),
    "fusion 360": faviconUrl("autodesk.com/products/fusion-360/overview"),
    "sketchup": skillIconUrl("Sketchup-Dark"),
    "unity": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg",
    "unreal engine": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unrealengine/unrealengine-original.svg",
    "autocad": skillIconUrl("AutoCAD-Dark"),
    "proxmox": faviconUrl("proxmox.com"),
    "cisco": resolveMediaUrl("logos/cisco.png"),
    "wireshark": resolveMediaUrl("logos/wireshark.png"),
    "capcut": resolveMediaUrl("logos/capcut.png"),
    "obs studio": faviconUrl("obsproject.com"),
    "cloudflare": skillIconUrl("Cloudflare-Dark"),
    "tailscale": faviconUrl("tailscale.com"),
    "wireguard": faviconUrl("wireguard.com"),
    "pfsense": faviconUrl("pfsense.org"),
    "truenas": faviconUrl("truenas.com"),
    "virtualbox": faviconUrl("virtualbox.org"),
    "vmware": faviconUrl("vmware.com"),
    "socket.io": faviconUrl("socket.io"),
    "jwt": faviconUrl("jwt.io"),
    "websocket": ""
  };

  if (deviconUrls[key]) {
    return deviconUrls[key];
  }
  
  // Fallback to reliable colored assets for tools that are not in Devicon.
  const simpleIconsMapping = {
    "yolo": faviconUrl("ultralytics.com"),
    "hugging face": "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    "render": "https://render.com/images/deploy-to-render-button.svg",
    "firebase": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg"
  };
  
  return simpleIconsMapping[key] || "";
}
