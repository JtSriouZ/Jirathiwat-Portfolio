export const EUROPEAN_ART = [
  "/ornament/european-swing.png",
  "/ornament/european-riders.png",
  "/ornament/european-starry.png",
  "/ornament/european-sunrise.png",
  "/ornament/european-garden-night.jpg",
  "/ornament/european-hunt-dusk.jpg",
  "/ornament/european-venice-night.jpg",
  "/ornament/european-gallery.jpg",
  "/ornament/european-ruins.jpg",
  "/ornament/european-tempest.jpg",
  "/ornament/european-salon.jpg",
  "/ornament/european-chateau.jpg",
];

const ART_ROUTES = [
  "home",
  "projects",
  "project",
  "certificates",
  "certificate",
  "skills",
  "about",
  "blog",
  "post",
  "admin",
];

function hashSeed(seed) {
  let hash = 2166136261;
  const text = String(seed);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, seed) {
  const next = [...list];
  const random = mulberry32(hashSeed(seed));
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function getArtRouteKey(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return "home";
  if (parts[0] === "projects" && parts[1]) return "project";
  if (parts[0] === "certificates" && parts[1]) return "certificate";
  if (parts[0] === "blog" && parts[1]) return "post";
  return parts[0];
}

export function createVisitArtMap(seed = `${Date.now()}-${Math.random()}`, paintings, museumArt = []) {
  const custom = Array.isArray(paintings) ? paintings.filter(Boolean) : [];
  const local = shuffle(custom.length ? custom : EUROPEAN_ART, seed);
  const art = [...shuffle(museumArt.filter(Boolean), seed), ...local];
  return ART_ROUTES.reduce((map, route, index) => {
    map[route] = art[index % art.length];
    return map;
  }, {});
}

export const ART_ROUTE_COUNT = ART_ROUTES.length;

export async function fetchMuseumArt(count = ART_ROUTES.length + 6) {
  const response = await fetch(`/api/art/random?count=${count}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Museum art request failed (${response.status})`);
  const data = await response.json();
  return Array.isArray(data?.art) ? data.art.filter((item) => item?.src) : [];
}

const artLuma = new Map();

function readLuma(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, 24, 24);
    const { data } = context.getImageData(0, 0, 24, 24);
    let total = 0;
    for (let index = 0; index < data.length; index += 4) {
      total += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
    }
    return total / (data.length / 4) / 255;
  } catch {
    return null;
  }
}

function loadArtImage(src, onLoad, onError) {
  const image = new Image();
  image.decoding = "async";
  image.crossOrigin = "anonymous";
  image.onload = () => {
    if (!artLuma.has(src)) artLuma.set(src, readLuma(image));
    onLoad(image);
  };
  image.onerror = () => {
    const plain = new Image();
    plain.decoding = "async";
    plain.onload = () => {
      if (!artLuma.has(src)) artLuma.set(src, null);
      onLoad(plain);
    };
    plain.onerror = onError;
    plain.src = src;
  };
  image.src = src;
}

export function measureArtLuma(src) {
  if (!src) return Promise.resolve(null);
  if (artLuma.has(src)) return Promise.resolve(artLuma.get(src));
  return new Promise((resolve) => {
    loadArtImage(src, () => resolve(artLuma.get(src) ?? null), () => resolve(null));
  });
}

const LUMA_REFERENCE = 0.18;
const ART_BRIGHTNESS = 0.54;

export function artBrightness(luma) {
  if (luma == null) return 0.42;
  const scaled = ART_BRIGHTNESS * Math.sqrt(LUMA_REFERENCE / Math.max(luma, 0.01));
  return Math.min(ART_BRIGHTNESS, Math.max(0.3, scaled));
}

export function keepLandscapeArt(items, needed = ART_ROUTES.length, timeout = 9000) {
  return new Promise((resolve) => {
    const kept = [];
    let settled = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(kept);
    };
    const timer = window.setTimeout(finish, timeout);
    if (!items.length) finish();
    items.forEach((item) => {
      loadArtImage(
        item.src,
        (image) => {
          if (image.naturalWidth >= 900 && image.naturalWidth > image.naturalHeight * 1.1) kept.push(item);
          settled += 1;
          if (kept.length >= needed || settled === items.length) finish();
        },
        () => {
          settled += 1;
          if (settled === items.length) finish();
        }
      );
    });
  });
}

export function preloadEuropeanArt(paintings) {
  const custom = Array.isArray(paintings) ? paintings.filter(Boolean) : [];
  const art = custom.length ? custom : EUROPEAN_ART;
  art.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}
