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

export function createVisitArtMap(seed = `${Date.now()}-${Math.random()}`) {
  const deck = shuffle(EUROPEAN_ART, seed);
  return ART_ROUTES.reduce((map, route, index) => {
    map[route] = deck[index % deck.length];
    return map;
  }, {});
}

export function preloadEuropeanArt() {
  EUROPEAN_ART.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}
