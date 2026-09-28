#!/usr/bin/env node
/**
 * Estrae lo stock veicoli pubblico di rubeca.it e scrive src/vehicles.json.
 *
 *   node scripts/estrai-veicoli.mjs
 *
 * Fonti (HTML servito dal server, piattaforma DealerK):
 *   - https://www.rubeca.it/promozioni-auto-nuove/?page=N  (nuove / km0)
 *   - https://www.rubeca.it/usato-certificato/?page=N      (Usato Certificato)
 *   - pagina di dettaglio di ogni veicolo (JSON-LD Vehicle + tabella specifiche)
 *
 * Regola: ogni campo viene copiato dalla fonte. Se la fonte non lo riporta resta null.
 * Nessun calcolo (IVA, canoni, sconti) viene fatto qui.
 * Lo stock cambia: rilanciare lo script prima di ogni pubblicazione.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/vehicles.json'); // selezione mostrata in pagina
const OUT_FULL = resolve(ROOT, 'scripts/stock-completo.json'); // tutto lo stock, solo come riferimento
const PER_STATE = 12; // mix bilanciato: fino a 12 veicoli per stato
const SOURCES = [
  { url: 'https://www.rubeca.it/promozioni-auto-nuove/', label: 'promozioni-auto-nuove' },
  { url: 'https://www.rubeca.it/usato-certificato/', label: 'usato-certificato' },
];
const UA = 'Mozilla/5.0 (compatible; RubecaStockSync/1.0)';
const CONCURRENCY = 3;
const MAX_PHOTOS = 4;
const PHOTO_SIZE = '800x0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === tries - 1) throw new Error(`${url}: ${err.message}`);
      await sleep(1000 * (i + 1));
    }
  }
  return '';
}

const blank = (s) => (s == null || /^[-\s]*$/.test(String(s)) ? null : s);
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
const text = (html) => decode(html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const euro = (s) => (s ? Number(s.replace(/[^\d,]/g, '').replace(',', '.')) || null : null);
const num = (s) => (s ? Number(s.replace(/\./g, '').replace(',', '.')) : null);

/* ---------- listing ---------- */
function parseListing(html) {
  const total = Number(html.match(/results-counter[^>]*>\s*<strong>(\d+)<\/strong>/)?.[1] || 0);
  const cards = html.split(/<div class="card card--boxed[^"]*vcard[^"]*" data-id="/).slice(1);
  const items = cards.map((chunk) => {
    const id = chunk.match(/^(\d+)/)[1];
    const badges = [...chunk.matchAll(/ebadge__text">\s*([^<]+?)\s*</g)].map((m) => decode(m[1]));
    const link = chunk.match(/<h2 class="vcard-main-info__make-model[^>]*>\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    const versionBlock = chunk.match(/vcard-main-info__version-heading">([^<]+)<\/h3>/);
    // prezzo di vendita: il valore in evidenza (text-offer). Il listino barrato non viene usato.
    const offer = chunk.match(/vcard-price__price[^"]*text-offer[^"]*">\s*([^<]+)</) || chunk.match(/<div class="vcard-price__price[^"]*">\s*([^<]+)</);
    const summary = chunk.match(/vcard-consumption__title">\s*([^<]+?)\s*</)?.[1] || '';
    const consumo = chunk.match(/Consumo \(combinato\):\s*<strong>([^<]+)<\/strong>/)?.[1] || null;
    const co2 = chunk.match(/Emissioni di CO2 \(combinate\):\s*<strong>([^<]+)<\/strong>/)?.[1] || null;
    const classe = chunk.match(/Classe di emissione:\s*<strong>([^<]+)<\/strong>/)?.[1] || null;
    return {
      id,
      url: link ? decode(link[1]) : null,
      makeModel: link ? decode(link[2]).trim() : null,
      versione: versionBlock ? decode(versionBlock[1]).trim() : null,
      prezzo: offer ? euro(offer[1]) : null,
      badges,
      summary: decode(summary),
      consumoCombinato: consumo ? decode(consumo).trim() : null,
      emissioniCo2: co2 ? decode(co2).trim() : null,
      classeEmissione: classe ? decode(classe).trim() : null,
    };
  });
  return { total, items };
}

async function crawlSource(src) {
  const first = parseListing(await get(src.url));
  const pages = Math.max(1, Math.ceil(first.total / Math.max(1, first.items.length)));
  const all = [...first.items];
  for (let p = 2; p <= pages; p++) {
    await sleep(400);
    const { items } = parseListing(await get(`${src.url}?page=${p}`));
    if (!items.length) break;
    all.push(...items);
  }
  const unique = [...new Map(all.map((v) => [v.id, v])).values()];
  console.log(`${src.label}: ${unique.length} veicoli su ${first.total} dichiarati (${pages} pagine)`);
  return { declared: first.total, items: unique.map((v) => ({ ...v, source: src.label })) };
}

/* ---------- dettaglio ---------- */
function spec(t, label, nextLabels) {
  const i = t.indexOf(` ${label} `);
  if (i < 0) return null;
  let rest = t.slice(i + label.length + 2);
  let cut = rest.length;
  for (const n of nextLabels) {
    const j = rest.indexOf(` ${n} `);
    if (j >= 0 && j < cut) cut = j;
  }
  rest = rest.slice(0, Math.min(cut, 60)).trim();
  return rest || null;
}
const LABELS = [
  'Chilometraggio', 'Alimentazione', 'Classe emissioni', 'Cambio', 'Potenza', 'Trazione', 'N. di Posti',
  'Immatricolazione', 'Colore esterni', 'Colore', 'Colore interni', 'Tappezzeria', 'Porte', 'Carrozzeria', 'Descrizione', 'Garanzia',
];

async function detail(v) {
  if (!v.url) return {};
  const html = await get(v.url);
  let ld = null;
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const graph = j['@graph'] || [j];
      ld = graph.find((n) => n['@type'] === 'Vehicle' || n['@type'] === 'Car') || ld;
    } catch {
      /* JSON-LD non valido: ignorato */
    }
  }
  const t = ' ' + text(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')) + ' ';
  const others = (l) => LABELS.filter((x) => x !== l);
  const km = spec(t, 'Chilometraggio', others('Chilometraggio'));
  const cambio = spec(t, 'Cambio', others('Cambio'));
  const potenza = spec(t, 'Potenza', others('Potenza'));
  const classe = spec(t, 'Classe emissioni', others('Classe emissioni'));
  // Solo la galleria del veicolo (formato 800x0). I "veicoli simili" in fondo alla pagina usano 0x250 e restano fuori.
  const ids = [...new Set([...html.matchAll(/vehicle\/images\/800x0\/(\d+)\/([A-Za-z0-9]+\.(?:jpe?g|JPG|JPEG|png|webp))/g)].map((m) => `${m[1]}/${m[2]}`))];
  const main = ld?.image?.match(/\/(\d+\/[A-Za-z0-9]+\.[A-Za-z]+)$/)?.[1];
  const ordered = main ? [main, ...ids.filter((x) => x !== main)] : ids;
  return {
    km: km && /km/i.test(km) ? num(km.replace(/km/i, '')) : null,
    cambio: cambio || ld?.vehicleTransmission || null,
    potenzaCv: potenza?.match(/\((\d+)\s*CV\)/i)?.[1] ? Number(potenza.match(/\((\d+)\s*CV\)/i)[1]) : null,
    classeEmissione: classe || null,
    colore: ld?.color || null,
    anno: ld?.vehicleModelDate ? Number(ld.vehicleModelDate) : null,
    alimentazioneLd: ld?.fuelType || null,
    foto: ordered.slice(0, MAX_PHOTOS).map((p) => `https://cdn.dealerk.it/dealer/datafiles/vehicle/images/${PHOTO_SIZE}/${p}`),
  };
}

async function pool(list, n, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < list.length) {
        const k = i++;
        try {
          out[k] = await fn(list[k]);
        } catch (e) {
          console.warn('dettaglio non letto:', e.message);
          out[k] = {};
        }
        await sleep(250);
      }
    }),
  );
  return out;
}

/* ---------- normalizzazione ---------- */
function stato(v) {
  if (v.source === 'usato-certificato') return 'Usato Certificato';
  if (/\/km-?0\//i.test(v.url || '') || v.badges.some((b) => /^km\s?0$/i.test(b))) return 'Km0';
  if (/\/nuov/i.test(v.url || '') || v.badges.includes('Nuova')) return 'Nuovo';
  return null;
}

function normalize(v, d) {
  // riepilogo listing: "09/2020 - 84.839 Km - Benzina" oppure "2026 - Benzina"
  const parts = v.summary.split(' - ').map((s) => s.trim());
  const annoListing = parts[0]?.match(/(\d{4})$/)?.[1];
  const kmListing = parts.find((p) => /km$/i.test(p));
  const alimentazione = parts.length > 1 ? parts[parts.length - 1] : d.alimentazioneLd;
  const [marca, ...rest] = (v.makeModel || '').split(' ');
  return {
    id: v.id,
    stato: stato(v),
    marca: marca || null,
    modello: rest.join(' ') || null,
    versione: v.versione,
    anno: annoListing ? Number(annoListing) : d.anno ?? null,
    immatricolazione: /^\d{2}\/\d{4}$/.test(parts[0] || '') ? parts[0] : null,
    km: kmListing ? num(kmListing.replace(/km/i, '')) : d.km ?? null,
    alimentazione: alimentazione || null,
    cambio: d.cambio ?? null,
    potenzaCv: d.potenzaCv ?? null,
    colore: d.colore ?? null,
    prezzo: v.prezzo,
    prezzoNota: null, // la fonte non dichiara IVA inclusa/esclusa accanto al prezzo
    canoneMensile: null, // nessun canone con condizioni (TAN/TAEG/durata) nelle fonti
    canoneNota: null,
    consumoCombinato: blank(v.consumoCombinato),
    emissioniCo2: blank(v.emissioniCo2),
    classeEmissione: blank(v.classeEmissione) || blank(d.classeEmissione) || null,
    foto: d.foto || [],
    urlScheda: v.url,
  };
}

/* ---------- main ---------- */
const started = new Date();
const crawled = [];
const declared = {};
for (const src of SOURCES) {
  const { declared: n, items } = await crawlSource(src);
  declared[src.label] = n;
  crawled.push(...items);
}
console.log(`Lettura di ${crawled.length} pagine di dettaglio...`);
const details = await pool(crawled, CONCURRENCY, detail);
const vehicles = crawled.map((v, i) => normalize(v, details[i] || {})).filter((v) => v.stato && v.prezzo);

/* Selezione bilanciata: per ogni stato, i gruppi modello + alimentazione vengono presi a turno
   (dal gruppo col prezzo più basso) e da ogni gruppo si prende il veicolo più economico.
   Deterministica: stessi dati, stessa selezione. */
function selectBalanced(list, perState) {
  const picked = [];
  for (const st of [...new Set(list.map((v) => v.stato))]) {
    const groups = new Map();
    for (const v of list.filter((x) => x.stato === st)) {
      const k = `${v.marca}|${v.modello}|${v.alimentazione}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(v);
    }
    const queues = [...groups.values()]
      .map((g) => g.sort((a, b) => a.prezzo - b.prezzo || a.id.localeCompare(b.id)))
      .sort((a, b) => a[0].prezzo - b[0].prezzo);
    const out = [];
    while (out.length < perState && queues.some((q) => q.length)) {
      for (const q of queues) if (q.length && out.length < perState) out.push(q.shift());
    }
    picked.push(...out);
  }
  return picked.sort((a, b) => a.prezzo - b.prezzo);
}

const count = (list) => list.reduce((a, v) => ((a[v.stato] = (a[v.stato] || 0) + 1), a), {});
const selection = selectBalanced(vehicles, PER_STATE);
const meta = {
  estrattoIl: started.toISOString(),
  fonti: SOURCES.map((s) => s.url),
  dichiaratiDallaFonte: declared,
  stockTotale: vehicles.length,
  stockPerStato: count(vehicles),
};
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT_FULL, JSON.stringify({ ...meta, veicoli: vehicles }, null, 2) + '\n', 'utf8');
await writeFile(
  OUT,
  JSON.stringify(
    { ...meta, selezione: `mix bilanciato, ${PER_STATE} per stato`, mostrati: selection.length, mostratiPerStato: count(selection), veicoli: selection },
    null,
    2,
  ) + '\n',
  'utf8',
);
console.log('Stock per stato:', count(vehicles), '· selezione:', count(selection));
console.log(`Scritti ${OUT} (${selection.length}) e ${OUT_FULL} (${vehicles.length})`);
