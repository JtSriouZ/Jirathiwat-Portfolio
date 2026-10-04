const USER_AGENT = "JirathiwatPortfolio/1.0 (random European painting backgrounds)";
const POOL_TTL = 1000 * 60 * 60 * 6;
const COMMONS_WIDTH = 1280;

const EUROPEAN_MUSEUMS = {
  louvre: "Q19675",
  rijksmuseum: "Q190804",
  nationalGallery: "Q180788",
  prado: "Q160112",
  uffizi: "Q51252",
  orsay: "Q23402",
  kunsthistorisches: "Q95569",
  hermitage: "Q132783",
  bavarianCollections: "Q812285",
  altePinakothek: "Q154568",
  dresdenAlteMeister: "Q4890",
  warsawNational: "Q153306"
};

const SCENIC_GENRES = {
  landscape: "Q191163",
  marine: "Q158607",
  cityscape: "Q1935974",
  genreScene: "Q1047337",
  animal: "Q16875712"
};

const WIKIDATA_QUERY = `SELECT ?item ?title ?image ?creator ?year ?museumName WHERE {
  VALUES ?museum { ${Object.values(EUROPEAN_MUSEUMS).map((id) => `wd:${id}`).join(" ")} }
  VALUES ?genre { ${Object.values(SCENIC_GENRES).map((id) => `wd:${id}`).join(" ")} }
  ?item wdt:P31 wd:Q3305213;
        wdt:P136 ?genre;
        wdt:P195 ?museum;
        wdt:P18 ?image;
        wdt:P2048 ?height;
        wdt:P2049 ?width;
        wdt:P571 ?inception .
  FILTER(?width > ?height * 1.2 && YEAR(?inception) < 1900)
  BIND(YEAR(?inception) AS ?year)
  OPTIONAL { ?item rdfs:label ?title FILTER(LANG(?title) = "en") }
  OPTIONAL { ?item wdt:P170/rdfs:label ?creator FILTER(LANG(?creator) = "en") }
  OPTIONAL { ?museum rdfs:label ?museumName FILTER(LANG(?museumName) = "en") }
}
LIMIT 240`;

const pools = new Map();

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...(options.headers || {}) },
    signal: AbortSignal.timeout(options.timeout || 20000)
  });
  if (!response.ok) {
    throw new Error(`${new URL(url).host} responded ${response.status}`);
  }
  return response.json();
}

async function loadWikidata() {
  const data = await fetchJson(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(WIKIDATA_QUERY)}`,
    { headers: { Accept: "application/sparql-results+json" }, timeout: 45000 }
  );
  const byItem = new Map();
  for (const row of data?.results?.bindings || []) {
    const id = row.item?.value;
    const image = row.image?.value;
    if (!id || !image || byItem.has(id)) continue;
    byItem.set(id, {
      src: `${image.replace(/^http:/, "https:")}?width=${COMMONS_WIDTH}`,
      commonsFile: decodeURIComponent(image.split("/Special:FilePath/")[1] || ""),
      title: row.title?.value || "Untitled",
      artist: row.creator?.value || "",
      date: row.year?.value || "",
      museum: row.museumName?.value || "",
      link: id.replace(/^http:/, "https:"),
      source: "Wikimedia Commons"
    });
  }
  return [...byItem.values()];
}

const SOURCES = {
  wikidata: loadWikidata
};

async function getPool(name) {
  const cached = pools.get(name);
  if (cached?.items && Date.now() - cached.loadedAt < POOL_TTL) return cached.items;
  if (cached?.pending) return cached.pending;

  const pending = SOURCES[name]()
    .then((items) => {
      pools.set(name, { items, loadedAt: Date.now() });
      return items;
    })
    .catch((error) => {
      if (cached?.items) {
        pools.set(name, cached);
        return cached.items;
      }
      pools.delete(name);
      throw error;
    });
  pools.set(name, { ...cached, pending });
  return pending;
}

const commonsThumbs = new Map();

async function resolveCommonsThumbs(items) {
  const missing = [...new Set(items.map((item) => item.commonsFile).filter((file) => file && !commonsThumbs.has(file)))];
  if (missing.length) {
    try {
      const titles = missing.slice(0, 50).map((file) => `File:${file}`).join("|");
      const data = await fetchJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=${COMMONS_WIDTH}&titles=${encodeURIComponent(titles)}`,
        { timeout: 10000 }
      );
      const original = new Map((data?.query?.normalized || []).map((entry) => [entry.to, entry.from]));
      for (const page of Object.values(data?.query?.pages || {})) {
        const thumb = page.imageinfo?.[0]?.thumburl;
        const title = original.get(page.title) || page.title;
        if (thumb) commonsThumbs.set(title.replace(/^File:/, ""), thumb);
      }
    } catch (error) {
      console.warn("Commons thumbnail lookup failed:", error.message);
    }
  }
  return items.map(({ commonsFile, ...item }) => ({
    ...item,
    src: (commonsFile && commonsThumbs.get(commonsFile)) || item.src
  }));
}

function sample(list, count) {
  const copy = [...list];
  const picked = [];
  while (copy.length && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
}

function sampleAcrossMuseums(items, count) {
  const byMuseum = new Map();
  for (const item of items) {
    const key = item.museum || "other";
    if (!byMuseum.has(key)) byMuseum.set(key, []);
    byMuseum.get(key).push(item);
  }
  const groups = sample([...byMuseum.values()], byMuseum.size).map((group) => sample(group, count));
  const picked = [];
  while (picked.length < count && groups.some((group) => group.length)) {
    for (const group of groups) {
      if (picked.length >= count) break;
      if (group.length) picked.push(group.shift());
    }
  }
  return picked;
}

export async function getRandomMuseumArt(count = 12) {
  const names = Object.keys(SOURCES);
  const results = await Promise.allSettled(names.map((name) => getPool(name)));
  const available = results
    .map((result, index) => ({ name: names[index], items: result.status === "fulfilled" ? result.value : [] }))
    .filter((entry) => entry.items.length);

  if (!available.length) {
    const reason = results.find((result) => result.status === "rejected")?.reason;
    throw new Error(reason?.message || "No museum collection could be reached.");
  }

  const weights = available.map((entry) => Math.sqrt(entry.items.length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const picked = available.flatMap((entry, index) =>
    sampleAcrossMuseums(entry.items, Math.ceil((count * weights[index]) / totalWeight))
  );
  return {
    art: await resolveCommonsThumbs(sample(picked, count)),
    sources: Object.fromEntries(available.map((entry) => [entry.name, entry.items.length]))
  };
}

export function warmMuseumArt() {
  for (const name of Object.keys(SOURCES)) {
    getPool(name).catch((error) => console.warn(`Museum art source "${name}" unavailable:`, error.message));
  }
}
