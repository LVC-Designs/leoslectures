// Simplified SVG map of Italy: hand-drawn coastline from approximate lon/lat points,
// plus one marker per region (its capoluogo). Used for locator maps in lessons.
const MAIN = [[7.6,43.8],[8.2,44.0],[8.9,44.4],[9.8,44.1],[10.3,43.5],[10.5,42.9],[11.0,42.6],[11.8,42.1],[12.2,41.8],[12.6,41.4],[13.6,41.2],[14.0,40.95],[14.25,40.85],[14.4,40.6],[14.8,40.65],[15.5,40.0],[16.0,39.4],[15.9,38.4],[15.65,38.1],[16.05,37.9],[16.3,38.2],[17.1,39.1],[17.1,39.4],[16.5,39.7],[17.25,40.45],[18.0,40.05],[18.35,39.8],[18.5,40.15],[17.95,40.65],[16.9,41.1],[16.3,41.3],[15.9,41.6],[16.2,41.9],[15.0,42.0],[14.2,42.45],[13.9,42.95],[13.5,43.6],[12.55,44.05],[12.3,44.4],[12.5,44.95],[12.35,45.45],[13.75,45.65],[13.6,45.95],[13.6,46.5],[12.4,46.7],[11.5,47.0],[10.5,46.85],[10.1,46.5],[9.4,46.3],[9.0,46.0],[8.3,46.1],[7.9,45.9],[6.9,45.8],[6.7,45.1],[7.1,44.7],[7.6,44.1]];
const SICILY = [[15.55,38.2],[15.65,38.27],[15.25,38.2],[14.0,38.05],[13.35,38.15],[12.75,38.2],[12.5,38.0],[12.45,37.8],[12.6,37.65],[13.1,37.5],[13.6,37.25],[13.95,37.1],[14.25,37.05],[15.15,36.7],[15.3,37.05],[15.1,37.5],[15.3,37.85]];
const SARDINIA = [[9.2,41.25],[9.55,40.9],[9.8,40.5],[9.7,39.9],[9.5,39.1],[9.1,39.2],[8.65,38.9],[8.4,39.0],[8.5,39.9],[8.15,40.55],[8.4,40.85],[8.25,41.1]];

export const REGIONS = [
  { key: 'valle-daosta', name: "Valle d'Aosta", article: 'la', cap: 'Aosta', lon: 7.32, lat: 45.74 },
  { key: 'piemonte', name: 'Piemonte', article: 'il', cap: 'Torino', lon: 7.7, lat: 45.07 },
  { key: 'lombardia', name: 'Lombardia', article: 'la', cap: 'Milano', lon: 9.19, lat: 45.46 },
  { key: 'trentino', name: 'Trentino-Alto Adige', article: 'il', cap: 'Trento', lon: 11.12, lat: 46.07 },
  { key: 'veneto', name: 'Veneto', article: 'il', cap: 'Venezia', lon: 12.33, lat: 45.44 },
  { key: 'friuli', name: 'Friuli-Venezia Giulia', article: 'il', cap: 'Trieste', lon: 13.77, lat: 45.65 },
  { key: 'liguria', name: 'Liguria', article: 'la', cap: 'Genova', lon: 8.93, lat: 44.41 },
  { key: 'emilia', name: 'Emilia-Romagna', article: "l'", cap: 'Bologna', lon: 11.34, lat: 44.49 },
  { key: 'toscana', name: 'Toscana', article: 'la', cap: 'Firenze', lon: 11.25, lat: 43.77 },
  { key: 'umbria', name: 'Umbria', article: "l'", cap: 'Perugia', lon: 12.39, lat: 43.11 },
  { key: 'marche', name: 'Marche', article: 'le', cap: 'Ancona', lon: 13.52, lat: 43.62 },
  { key: 'lazio', name: 'Lazio', article: 'il', cap: 'Roma', lon: 12.5, lat: 41.9 },
  { key: 'abruzzo', name: 'Abruzzo', article: "l'", cap: "L'Aquila", lon: 13.4, lat: 42.35 },
  { key: 'molise', name: 'Molise', article: 'il', cap: 'Campobasso', lon: 14.66, lat: 41.56 },
  { key: 'campania', name: 'Campania', article: 'la', cap: 'Napoli', lon: 14.25, lat: 40.85 },
  { key: 'puglia', name: 'Puglia', article: 'la', cap: 'Bari', lon: 16.87, lat: 41.12 },
  { key: 'basilicata', name: 'Basilicata', article: 'la', cap: 'Potenza', lon: 15.8, lat: 40.64 },
  { key: 'calabria', name: 'Calabria', article: 'la', cap: 'Catanzaro', lon: 16.6, lat: 38.91 },
  { key: 'sicilia', name: 'Sicilia', article: 'la', cap: 'Palermo', lon: 13.36, lat: 38.12 },
  { key: 'sardegna', name: 'Sardegna', article: 'la', cap: 'Cagliari', lon: 9.11, lat: 39.22 },
];

const K = 56, COS = 0.74;
const px = ([lon, lat]) => [((lon - 6.3) * K * COS).toFixed(1), ((47.3 - lat) * K).toFixed(1)];
const poly = (pts) => 'M' + pts.map(px).map(p => p.join(',')).join(' L') + ' Z';
const W = Math.round((18.9 - 6.3) * K * COS), H = Math.round((47.3 - 36.4) * K);

/** Render the map. opts: { highlight: [regionKey], labels: 'all'|'highlight'|'none', title } */
export function italyMap(opts = {}) {
  const hl = new Set(opts.highlight || []);
  const labels = opts.labels || (hl.size ? 'highlight' : 'all');
  const marks = REGIONS.map(r => {
    const [x, y] = px([r.lon, r.lat]);
    const on = hl.has(r.key);
    const show = labels === 'all' || (labels === 'highlight' && on);
    const lab = show ? `<text x="${+x + 7}" y="${+y + 4}" class="map-label${on ? ' on' : ''}">${r.cap}</text>` : '';
    return `<g class="map-mark${on ? ' on' : ''}" data-region="${r.key}"><title>${r.name} · ${r.cap}</title><circle cx="${x}" cy="${y}" r="${on ? 6 : 3.2}"/>${lab}</g>`;
  }).join('');
  return `<svg class="italy-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title || "Mappa d'Italia"}">
<path class="map-land" d="${poly(MAIN)}"/><path class="map-land" d="${poly(SICILY)}"/><path class="map-land" d="${poly(SARDINIA)}"/>${marks}</svg>`;
}

export function compassRose() {
  const pts = [['nord', 0], ['nord-est', 45], ['est', 90], ['sud-est', 135], ['sud', 180], ['sud-ovest', 225], ['ovest', 270], ['nord-ovest', 315]];
  const items = pts.map(([n, a]) => {
    const r = a % 90 === 0 ? 92 : 78; const rad = (a - 90) * Math.PI / 180;
    const x = (120 + r * Math.cos(rad)).toFixed(1), y = (120 + r * Math.sin(rad)).toFixed(1);
    return `<text x="${x}" y="${y}" class="rose-label${a % 90 === 0 ? ' main' : ''}" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
  }).join('');
  return `<svg class="compass" viewBox="0 0 240 240" role="img" aria-label="I punti cardinali"><circle cx="120" cy="120" r="60" class="rose-ring"/><path class="rose-star" d="M120,62 L128,112 L178,120 L128,128 L120,178 L112,128 L62,120 L112,112 Z"/><path class="rose-star minor" d="M120,86 L126,114 L154,120 L126,126 L120,154 L114,126 L86,120 L114,114 Z" transform="rotate(45 120 120)"/>${items}</svg>`;
}
