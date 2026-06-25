export function getYoutubeEmbedUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
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
  return `${import.meta.env.BASE_URL}${url}`.replace(/([^:]\/)\/+/g, "$1");
}

export function triggerGoogleTranslate(languageCode) {
  document.cookie = `googtrans=/en/${languageCode}; path=/;`;
  document.cookie = `googtrans=/en/${languageCode}; path=/; domain=${window.location.hostname};`;
  window.location.reload();
  return true;
}

export function getSkillIconUrl(skillName) {
  const normalized = skillName.toLowerCase().trim();
  
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
    "java": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
    "c": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg",
    "c++": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg",
    "c/c++": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg",
    "git": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
    "github": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
    "docker": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
    "linux": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg",
    "kubernetes": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg",
    "gcp": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    "aws": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
    "node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
    "express.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg",
    "fastapi": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg",
    "graphql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain.svg",
    "mongodb": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
    "postgresql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
    "mysql": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg",
    "redis": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-plain.svg",
    "firebase": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg",
    "nginx": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nginx/nginx-original.svg",
    "heroku": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/heroku/heroku-original.svg",
    "postman": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postman/postman-original.svg",
    "html5": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
    "css3": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
    "javascript": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
    "typescript": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
    "react.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
    "next.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg",
    "vue.js": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg",
    "vite": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vite/vite-original.svg",
    "tailwind css": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
    "bootstrap": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bootstrap/bootstrap-original.svg",
    "sass": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg",
    "redux": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redux/redux-original.svg",
    "figma": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg",
    "adobe photoshop": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/photoshop/photoshop-original.svg",
    "adobe premiere pro": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/premierepro/premierepro-original.svg",
    "davinci resolve": "https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg",
    "adobe lightroom": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Adobe_Photoshop_Lightroom_CC_logo.svg",
    "chatgpt": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    "claude": "https://cdn.simpleicons.org/anthropic/D97757",
    "claude code": "https://cdn.simpleicons.org/anthropic/D97757",
    "gemini": "https://cdn.simpleicons.org/googlegemini/8E75B2",
    "codex": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    "antigravity": "https://www.google.com/s2/favicons?domain=deepmind.google&sz=128",
    "github copilot": "https://cdn.simpleicons.org/githubcopilot/FFFFFF",
    "cursor": "https://cdn.simpleicons.org/cursor/FFFFFF",
    "blender": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Blender_logo_no_text.svg",
    "midjourney": "https://www.google.com/s2/favicons?domain=midjourney.com&sz=128",
    "shapr3d": "https://www.google.com/s2/favicons?domain=shapr3d.com&sz=128",
    "capcut": "https://www.google.com/s2/favicons?domain=capcut.com&sz=128"
  };

  if (deviconUrls[normalized]) {
    return deviconUrls[normalized];
  }
  
  // Fallback to simpleicons for things like YOLO, Hugging Face, MLOps, Render
  const simpleIconsMapping = {
    'yolo': 'yolo',
    'hugging face': 'huggingface',
    'mlops': 'mlflow',
    'render': 'render',
    'claude': 'anthropic',
    'claude code': 'anthropic',
    'antigravity': 'google',
    'codex': 'openai',
    'chatgpt': 'openai',
    'gemini': 'googlegemini',
    'shapr3d': 'shapr3d',
    'adobe premiere pro': 'adobepremierepro',
    'adobe photoshop': 'adobephotoshop',
    'adobe lightroom': 'adobelightroom',
    'davinci resolve': 'davinciresolve',
    'github copilot': 'githubcopilot'
  };
  
  const slug = simpleIconsMapping[normalized] || normalized.replace(/[^a-z0-9]/g, '');
  return `https://cdn.simpleicons.org/${slug}`;
}
