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

export async function fetchMuseumArt(count = 24) {
  const response = await fetch(`/api/art/random?count=${count}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Museum art request failed (${response.status})`);
  const data = await response.json();
  return Array.isArray(data?.art) ? data.art.filter((item) => item?.src) : [];
}

const artTone = new Map();
const TONE_SIZE = 32;
const MAX_MUSEUM_LUMA = 0.38;
const MAX_WHITE_SHARE = 0.1;
const MAX_WHITE_EDGE = 0.3;

function readTone(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = TONE_SIZE;
    canvas.height = TONE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, TONE_SIZE, TONE_SIZE);
    const { data } = context.getImageData(0, 0, TONE_SIZE, TONE_SIZE);
    let total = 0;
    let white = 0;
    let edge = 0;
    let edgeWhite = 0;
    for (let pixel = 0; pixel < TONE_SIZE * TONE_SIZE; pixel += 1) {
      const index = pixel * 4;
      const luma = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
      const x = pixel % TONE_SIZE;
      const y = Math.floor(pixel / TONE_SIZE);
      total += luma;
      if (luma > 0.82) white += 1;
      if (x < 2 || y < 2 || x >= TONE_SIZE - 2 || y >= TONE_SIZE - 2) {
        edge += 1;
        if (luma > 0.8) edgeWhite += 1;
      }
    }
    const pixels = TONE_SIZE * TONE_SIZE;
    return { luma: total / pixels, white: white / pixels, edgeWhite: edgeWhite / edge };
  } catch {
    return null;
  }
}

function loadArtImage(src, onLoad, onError) {
  const image = new Image();
  image.decoding = "async";
  image.crossOrigin = "anonymous";
  image.onload = () => {
    if (!artTone.has(src)) artTone.set(src, readTone(image));
    onLoad(image);
  };
  image.onerror = () => {
    const plain = new Image();
    plain.decoding = "async";
    plain.onload = () => {
      if (!artTone.has(src)) artTone.set(src, null);
      onLoad(plain);
    };
    plain.onerror = onError;
    plain.src = src;
  };
  image.src = src;
}

function isDarkEnough(tone) {
  return Boolean(tone)
    && tone.luma <= MAX_MUSEUM_LUMA
    && tone.white <= MAX_WHITE_SHARE
    && tone.edgeWhite <= MAX_WHITE_EDGE;
}

export function measureArtLuma(src) {
  if (!src) return Promise.resolve(null);
  if (artTone.has(src)) return Promise.resolve(artTone.get(src)?.luma ?? null);
  return new Promise((resolve) => {
    loadArtImage(src, () => resolve(artTone.get(src)?.luma ?? null), () => resolve(null));
  });
}

const LUMA_REFERENCE = 0.18;
const ART_BRIGHTNESS = 0.68;

export function artBrightness(luma) {
  if (luma == null) return 0.52;
  const scaled = ART_BRIGHTNESS * Math.sqrt(LUMA_REFERENCE / Math.max(luma, 0.01));
  return Math.min(ART_BRIGHTNESS, Math.max(0.42, scaled));
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
          const landscape = image.naturalWidth >= 900 && image.naturalWidth > image.naturalHeight * 1.1;
          if (landscape && isDarkEnough(artTone.get(item.src))) kept.push(item);
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

export function localEuropeanArt(paintings) {
  const custom = Array.isArray(paintings) ? paintings.filter(Boolean) : [];
  return custom.length ? custom : EUROPEAN_ART;
}

export function preloadEuropeanArt(paintings) {
  localEuropeanArt(paintings).forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}
