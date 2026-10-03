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
}`;

const CLEVELAND_URL = "https://openaccess-api.clevelandart.org/api/artworks/?type=Painting"
  + "&department=European%20Painting%20and%20Sculpture&has_image=1&cc0=1&limit=1000"
  + "&fields=id,title,creators,creation_date,images,url";

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

async function loadCleveland() {
  const data = await fetchJson(CLEVELAND_URL);
  return (data?.data || [])
    .filter((item) => {
      const web = item.images?.web;
      const width = Number(web?.width);
      const height = Number(web?.height);
      return web?.url && width >= 900 && width > height * 1.15;
    })
    .map((item) => ({
      src: item.images.web.url,
      title: item.title || "Untitled",
      artist: String(item.creators?.[0]?.description || "").replace(/\s*\(.*$/, ""),
      date: item.creation_date || "",
      museum: "The Cleveland Museum of Art",
      link: item.url || "",
      source: "Cleveland Museum of Art Open Access"
    }));
}

const SOURCES = {
  wikidata: loadWikidata,
  cleveland: loadCleveland
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

function sample(list, count) {
  const copy = [...list];
  const picked = [];
  while (copy.length && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
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
    sample(entry.items, Math.ceil((count * weights[index]) / totalWeight))
  );
  return {
    art: sample(picked, count),
    sources: Object.fromEntries(available.map((entry) => [entry.name, entry.items.length]))
  };
}

export function warmMuseumArt() {
  for (const name of Object.keys(SOURCES)) {
    getPool(name).catch((error) => console.warn(`Museum art source "${name}" unavailable:`, error.message));
  }
}
