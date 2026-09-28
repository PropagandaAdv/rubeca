/**
 * RubecaHomepage.jsx
 * Homepage B2B di Rubeca Motori, concessionaria ufficiale Volkswagen.
 * Un unico componente React, stile solo Tailwind, icone lucide-react.
 *
 * DESIGN TOKEN (definiti in tailwind.config.js > theme.extend.colors.brand)
 *   brand-navy  #001E50  primario: hero e sezioni dark, titoli su chiaro, footer
 *   brand-slate #1E293B  secondario: testo corpo su chiaro
 *   brand-blue  #0066FF  accento: CTA, link, linea firma. In dosi rare.
 *   brand-mist  #F4F6F9  canvas chiaro
 *   brand-ice   #EEF6FA  sezioni alternate, card
 *   Font: Montserrat 300/400/600/700 (Google Fonts, display=swap, preconnect in index.html)
 *
 * CONTRASTI VERIFICATI
 *   bianco su navy 16.9:1 · blue su bianco 5.0:1 · slate su mist 13.4:1
 *   blue su navy 3.3:1, usato solo per testo >= 24px bold e per la linea firma
 *
 * ELEMENTO FIRMA: la linea sottile #0066FF che si disegna allo scroll
 *   (SVG stroke-dashoffset). Nasce dalla linea d'orizzonte del video hero,
 *   torna come indicatore di progresso, separatore di sezione, sotto i titoli
 *   delle card e nel focus dei campi del form.
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cog,
  Facebook,
  Fuel,
  Gauge,
  Instagram,
  Landmark,
  Leaf,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Route,
  ShieldCheck,
  RotateCcw,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
/* Stock veicoli estratto da rubeca.it con scripts/estrai-veicoli.mjs (vedi estrattoIl nel file). */
import VEHICLES_DATA from './vehicles.json';

/* ------------------------------------------------------------------ */
/* CONFIG: tutto ciò che non è nelle fonti verificate                  */
/* ------------------------------------------------------------------ */
const CONFIG = {
  // DA VERIFICARE CON IL CLIENTE: endpoint di invio del form (Formspree, CRM o webhook).
  // Finché è vuoto, le richieste NON arrivano da nessuna parte.
  formEndpoint: '',
  // DA VERIFICARE CON IL CLIENTE
  phone: '',
  // DA VERIFICARE CON IL CLIENTE
  email: '',
  // DA VERIFICARE CON IL CLIENTE: orari di apertura
  hours: '',
  // DA VERIFICARE CON IL CLIENTE: tempo di risposta promesso nel form
  responseTime: '24 ore lavorative',
  // DA VERIFICARE CON IL CLIENTE: le tre micro-garanzie accanto al form
  guarantees: [
    { icon: Clock, text: 'Risposta entro 24 ore lavorative' },
    { icon: UserRound, text: 'Un referente dedicato alla tua azienda' },
    { icon: ShieldCheck, text: 'Nessun impegno: è una proposta, non un contratto' },
  ],
  // DA VERIFICARE CON IL CLIENTE: indirizzi completi e link Google Maps delle due sedi.
  // L'indirizzo di Città della Pieve viene dalla fonte ma la sede di riferimento non è specificata.
  locations: [
    {
      city: 'Città della Pieve',
      province: 'PG',
      role: 'Sede principale, vendita e officina',
      address: 'Strada Provinciale Maranzano 4A/6',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Rubeca+Motori+Strada+Provinciale+Maranzano+Citt%C3%A0+della+Pieve',
    },
    {
      city: 'Sinalunga',
      province: 'SI',
      role: 'Sede di Sinalunga',
      address: '',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rubeca+Motori+Sinalunga',
    },
  ],
  // DA VERIFICARE CON IL CLIENTE: URL dei profili social ufficiali
  social: { instagram: '', linkedin: '', facebook: '' },
  // DA VERIFICARE CON IL CLIENTE: pagine legali (la privacy esiste su rubeca.it/privacy/)
  privacyUrl: 'https://www.rubeca.it/privacy/',
  cookieUrl: 'https://www.rubeca.it/privacy/',
  // DA VERIFICARE CON IL CLIENTE: anno del Sustainability Award (non leggibile nella fonte)
  sustainabilityAwardYear: null,
  // DA VERIFICARE: inserire solo testimonianze reali autorizzate
  testimonials: [],
  // DA VERIFICARE: inserire solo loghi di clienti che hanno dato il consenso
  clientLogos: [],
  companyName: 'Rubeca Motori S.r.l.',
  vat: '02937620546',
  // DA POPOLARE: feed stock del cliente (DMS/portale). Se valorizzato, i veicoli arrivano da qui
  // con fetch in pagina (JSON: array di veicoli oppure { veicoli: [...] }, schema VEHICLE_SCHEMA).
  // Se vuoto, si usa VEHICLES (estratto da rubeca.it).
  vehiclesFeedUrl: '',
  // DA VERIFICARE CON IL CLIENTE: pagina con tutto lo stock
  stockUrl: 'https://www.rubeca.it/auto/',
};

/* Schema di un veicolo. I campi assenti nella fonte restano null e non si mostrano.
   {
     id, stato,                 // "Nuovo" | "Km0" | "Usato Certificato"
     marca, modello, versione,
     anno, immatricolazione,    // immatricolazione "MM/AAAA" solo sugli usati
     km, alimentazione, cambio, potenzaCv, colore,
     prezzo,                    // numero in € come da fonte, nessun calcolo IVA
     prezzoNota,                // testo esatto della fonte, es. "IVA inclusa"
     canoneMensile, canoneNota, // solo se la fonte riporta anche le condizioni
     consumoCombinato, emissioniCo2, classeEmissione,
     foto: [url],               // solo foto reali del veicolo
     urlScheda                  // scheda sul sito del cliente
   } */
const VEHICLES = VEHICLES_DATA.veicoli || [];
const VEHICLES_UPDATED = VEHICLES_DATA.estrattoIl ? new Date(VEHICLES_DATA.estrattoIl) : null;

const ASSETS = {
  logo: '/assets/logo-rubeca.svg',
  heroVideo: '/assets/hero-scrub.mp4',
  heroVideoBytes: 6132721, // dimensione reale del file, fallback se manca Content-Length
  heroPoster: '/assets/hero-poster.webp', // primo frame del video
  heroEnding: '/assets/hero-ending.webp', // frame finale: immagine statica curata
  heroWidth: 1920,
  heroHeight: 1080,
  heroHorizon: 0.531, // altezza relativa della linea d'orizzonte nel frame finale
};

/* Le cinque condizioni in cui la hero diventa immagine statica.
   Identiche a quelle del CSS: nessun asset video viene scaricato se una è vera. */
const HERO_STATIC_GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
];

const NAV_LINKS = [
  { href: '#servizi', label: 'Servizi' },
  { href: '#veicoli', label: 'Veicoli' },
  { href: '#perche-noi', label: 'Perché noi' },
  { href: '#sedi', label: 'Sedi' },
  { href: '#contatti', label: 'Contatti' },
];

/* Didascalie della hero: ogni banda possiede un tratto di scroll (0..1). */
const HERO_BANDS = [
  {
    range: [0, 0.23],
    eyebrow: 'Flotte aziendali · Perugia e Siena',
    lines: ['Meno fornitori.', 'Meno fatture.', 'Meno telefonate.'],
  },
  {
    range: [0.25, 0.48],
    eyebrow: 'Un solo interlocutore',
    lines: ['Vendita, noleggio,', 'officina e ricambi.', 'Parli sempre con noi.'],
  },
  {
    range: [0.495, 0.735],
    eyebrow: 'Concessionaria ufficiale Volkswagen',
    lines: ['Da 60 anni', 'al fianco dei clienti.', '11 volte Volkswagen Award.'],
  },
];
const HERO_FINAL_RANGE = [0.77, 1];

const FLEET_MODES = {
  noleggio: {
    label: 'Noleggio',
    title: 'La flotta in noleggio',
    text: 'Breve o lungo termine, per aziende e partite IVA. Scegli i veicoli: officina e ricambi originali restano nella stessa concessionaria.',
    points: ['Noleggio a breve e lungo termine', 'Officina e ricambi originali Volkswagen', 'Un referente per tutta la flotta'],
    interest: 'Flotta in noleggio',
  },
  acquisto: {
    label: 'Acquisto flotta',
    title: 'La flotta di proprietà',
    text: 'Auto nuove, km0 o Usato Certificato Volkswagen, con finanziamento e assicurazione costruiti sulla tua azienda.',
    points: ['Auto nuove e km0', 'Usato Certificato Volkswagen', 'Servizi finanziari e assicurativi'],
    interest: 'Acquisto flotta',
  },
};

const SERVICES = [
  {
    id: 'lungo',
    icon: Route,
    title: 'Noleggio lungo termine',
    benefit: 'Una rata mensile per i veicoli che servono all’azienda ogni giorno.',
    image: '/assets/card-lungo-termine.webp',
    alt: 'Strada lunga e deserta tra le colline di notte, attraversata da una scia di luce blu',
  },
  {
    id: 'breve',
    icon: CalendarClock,
    title: 'Noleggio breve termine',
    benefit: 'Veicoli in più per una commessa, una stagione, un picco di lavoro.',
    image: '/assets/card-breve-termine.webp',
    alt: 'Sottopasso urbano notturno con una breve scia di luce blu sull’asfalto bagnato',
  },
  {
    id: 'service',
    icon: Wrench,
    title: 'Service Volkswagen e Audi',
    benefit: 'Officina e ricambi originali per le auto della flotta, senza rimbalzi.',
    image: '/assets/card-service.webp',
    alt: 'Officina ordinata e vuota con un ponte sollevatore e linee di luce blu su pavimento e soffitto',
  },
  {
    id: 'usato',
    icon: BadgeCheck,
    title: 'Usato Certificato e km0',
    benefit: 'Usato Certificato Volkswagen con meno di 150.000 km e 8 anni, e auto km0.',
    image: '/assets/card-usato.webp',
    alt: 'Dettaglio della carrozzeria curva di un’auto con un riflesso di luce blu',
  },
  {
    id: 'finanza',
    icon: Landmark,
    title: 'Servizi finanziari e assicurativi',
    benefit: 'Finanziamento e copertura assicurativa decisi insieme all’auto, nello stesso posto.',
    image: '/assets/card-finanza.webp',
    alt: 'Scrivania chiara con una cartellina blu, fogli bianchi e una penna, davanti a una vetrata al crepuscolo',
  },
];

const REASONS = [
  {
    objection: 'L’auto ferma costa anche quando non si muove.',
    answer:
      'A Città della Pieve vendita, officina e ricambi originali Volkswagen stanno nella stessa sede. Diagnosi, pezzo e riparazione passano da un solo posto.',
  },
  {
    objection: 'Le spese extra arrivano sempre dopo.',
    answer:
      'Prima di firmare mettiamo a confronto noleggio e acquisto, con finanziamento e assicurazione. Sai cosa paghi, e per cosa, prima di decidere.',
  },
  {
    objection: 'Troppi fornitori per la stessa auto.',
    answer:
      'Vendita, noleggio, officina, ricambi e assicurazione sotto lo stesso tetto. Per ogni veicolo della flotta c’è un solo numero da chiamare.',
  },
];

const STATS = [
  { value: 60, label: 'anni', caption: 'al fianco dei nostri clienti' },
  { value: 11, label: 'Volkswagen Award', caption: 'tra le migliori concessionarie Volkswagen d’Italia, anche nel 2026' },
  { value: 2, label: 'sedi', caption: 'Città della Pieve (PG) e Sinalunga (SI)' },
];

const VEHICLE_OPTIONS = ['1–5', '6–20', '21–50', 'Oltre 50'];
const INTEREST_OPTIONS = ['Flotta in noleggio', 'Acquisto flotta', 'Service flotta', 'Veicolo specifico', 'Ricerca veicolo', 'Altro'];

/* Classi condivise */
const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';
const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.25em]';
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2';
const BTN_PRIMARY = `inline-flex min-h-[48px] items-center whitespace-nowrap justify-center gap-2 rounded-full bg-brand-blue px-7 py-3 text-sm font-semibold text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#0057DB] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCUS_RING}`;
const TEXT_SHADOW = '[text-shadow:0_1px_2px_rgba(0,10,30,0.95),0_4px_16px_rgba(0,10,30,0.7),0_12px_40px_rgba(0,10,30,0.6)]';

/* ------------------------------------------------------------------ */
/* Utility                                                            */
/* ------------------------------------------------------------------ */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p, e0, e1) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/* true quando l'elemento entra in viewport (una sola volta) */
function useInView(ref, { rootMargin = '0px 0px -12% 0px', threshold = 0.15 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, inView, rootMargin, threshold]);
  return inView;
}

/* Decide in modo live tra hero scrub e hero statica (5 gate + connessione lenta). */
function useHeroMode() {
  const compute = () => {
    if (typeof window === 'undefined') return 'static';
    if (HERO_STATIC_GATES.some((q) => window.matchMedia(q).matches)) return 'static';
    const c = navigator.connection;
    if (c && (c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType))) return 'static';
    return 'scrub';
  };
  const [mode, setMode] = useState(compute);
  useEffect(() => {
    const mqls = HERO_STATIC_GATES.map((q) => window.matchMedia(q));
    const onChange = () => setMode(compute());
    mqls.forEach((m) => m.addEventListener('change', onChange));
    const c = navigator.connection;
    c?.addEventListener?.('change', onChange);
    return () => {
      mqls.forEach((m) => m.removeEventListener('change', onChange));
      c?.removeEventListener?.('change', onChange);
    };
  }, []);
  return mode;
}

/* Posizione in px della linea d'orizzonte di un'immagine 16:9 in object-cover. */
function useHorizon(ref) {
  const [hz, setHz] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      const scale = Math.max(w / ASSETS.heroWidth, h / ASSETS.heroHeight);
      const renderedH = ASSETS.heroHeight * scale;
      setHz(Math.round((h - renderedH) / 2 + renderedH * ASSETS.heroHorizon));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return hz;
}

/* ------------------------------------------------------------------ */
/* Elemento firma: linea che si disegna con lo scroll                  */
/* ------------------------------------------------------------------ */
function SignatureLine({ className = '', glow = true }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return undefined;
    if (reduced) {
      path.style.strokeDashoffset = '0';
      return undefined;
    }
    let raf = null;
    let last = -1;
    let onScreen = false;
    const update = () => {
      raf = null;
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh - r.top) / (vh * 0.55), 0, 1);
      const eased = easeOutCubic(p);
      if (Math.abs(eased - last) > 0.002) {
        last = eased;
        path.style.strokeDashoffset = String(1 - eased);
      }
    };
    const onScroll = () => {
      if (onScreen && raf === null) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) onScroll();
    });
    io.observe(svg);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="4"
      className={`block overflow-visible ${glow ? 'drop-shadow-[0_0_6px_rgba(0,102,255,0.55)]' : ''} ${className}`}
      aria-hidden="true"
    >
      <line
        ref={pathRef}
        x1="0"
        y1="2"
        x2="100%"
        y2="2"
        pathLength="1"
        stroke="#0066FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 1"
        strokeDashoffset="1"
      />
    </svg>
  );
}

/* Separatore di sezione: numero, etichetta e la linea firma */
function SectionMarker({ index, label, dark = false }) {
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span className={`${EYEBROW} shrink-0 ${dark ? 'text-white/70' : 'text-brand-navy/70'}`}>
        {index} · {label}
      </span>
      <SignatureLine />
    </div>
  );
}

/* Wrapper per le entrate in viewport, con cascata e reduced motion */
function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const delays = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-500', 'delay-700'];
  return (
    <Tag
      ref={ref}
      className={`transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        delays[delay] || 'delay-0'
      } ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setScrolled(window.scrollY > 80);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  /* Menu mobile: blocco dello scroll, focus trap, Esc per chiudere */
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')];
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      toggleRef.current?.focus();
    };
  }, [open]);

  const light = scrolled;
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,height] duration-500 ease-out motion-reduce:transition-none ${
        light
          ? 'h-16 border-b border-brand-navy/10 bg-brand-mist/90 backdrop-blur-md'
          : 'h-20 border-b border-transparent bg-transparent'
      }`}
    >
      <div className={`${CONTAINER} flex h-full items-center justify-between gap-6`}>
        <a href="#top" className={`shrink-0 rounded-md ${FOCUS_RING}`} aria-label="Rubeca Motori, torna all’inizio">
          <img
            src={ASSETS.logo}
            alt="Rubeca Motori Concessionaria Volkswagen"
            width="300"
            height="49"
            className={`h-7 w-auto transition-[filter] duration-500 sm:h-8 ${light ? '' : 'brightness-0 invert'}`}
          />
        </a>

        <nav aria-label="Principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${FOCUS_RING} ${
                    light ? 'text-brand-navy hover:text-brand-blue' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brand-blue transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#contatti" className={`${BTN_PRIMARY} hidden !min-h-[44px] !px-5 !py-2.5 sm:inline-flex`}>
            Richiedi una proposta
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${FOCUS_RING} ${
              light ? 'text-brand-navy' : 'text-white'
            }`}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Apri il menu"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Menu mobile full-screen */}
      <div
        id="menu-mobile"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-0 z-50 flex flex-col bg-brand-navy transition duration-500 ease-out motion-reduce:transition-none lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className={`${CONTAINER} flex h-20 items-center justify-between`}>
          <img src={ASSETS.logo} alt="" width="300" height="49" className="h-7 w-auto brightness-0 invert" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white ${FOCUS_RING} focus-visible:ring-offset-brand-navy`}
            aria-label="Chiudi il menu"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Menu mobile" className={`${CONTAINER} flex flex-1 flex-col justify-center`}>
          <ul className="space-y-2">
            {NAV_LINKS.map((l, i) => (
              <li
                key={l.href}
                className={`transition duration-700 ease-out motion-reduce:transition-none ${
                  open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                } ${['delay-100', 'delay-150', 'delay-200', 'delay-300', 'delay-500'][i]}`}
              >
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg py-2 text-4xl font-bold tracking-tight text-white ${FOCUS_RING} focus-visible:ring-offset-brand-navy`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-10 h-px w-full origin-left bg-brand-blue" aria-hidden="true" />
          <a href="#contatti" onClick={() => setOpen(false)} className={`${BTN_PRIMARY} mt-10 self-start focus-visible:ring-offset-brand-navy`}>
            Richiedi una proposta flotta <ArrowRight size={20} strokeWidth={1.5} />
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */
function HeroFinalContent({ hz, onCtaFocus, animated = false }) {
  /* In modalità scrub ogni parte entra in scena con --k (0..1) scritto dal loop di scroll */
  const part = animated
    ? {
        a: '[opacity:var(--k)]',
        b: '[opacity:clamp(0,calc(var(--k)_*_1.6_-_0.1),1)] [transform:translateY(calc((1_-_var(--k))_*_1.5rem))]',
        c: '[opacity:clamp(0,calc(var(--k)_*_2.5_-_1.2),1)]',
        d: '[opacity:clamp(0,calc(var(--k)_*_3_-_1.9),1)] [transform:translateY(calc((1_-_var(--k))_*_1rem))]',
      }
    : { a: '', b: '', c: '', d: '' };
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 flex items-end pb-[4vh]"
        style={{ height: hz ? `${hz}px` : '53%' }}
      >
        <div className={CONTAINER}>
          <p className={`${part.a} ${EYEBROW} mb-5 text-white/80 ${TEXT_SHADOW}`}>
            Rubeca Motori per le aziende
          </p>
          <h1
            id="hero-title"
            className={`${part.b} max-w-[14ch] text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-8xl [@media(max-height:760px)]:lg:text-7xl ${TEXT_SHADOW}`}
          >
            La flotta che non si{' '}
            <span className="bg-gradient-to-r from-white to-brand-blue bg-clip-text text-transparent [text-shadow:none]">
              ferma.
            </span>
          </h1>
        </div>
      </div>
      {/* Sotto la linea: promessa e CTA, abbastanza lontane dal riflesso per restare leggibili */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: hz ? `calc(${hz}px + 8vh)` : 'calc(53% + 8vh)' }}>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_20%_30%,rgba(0,10,30,0.55)_0%,rgba(0,10,30,0)_75%)]"
        />
        <div className={`${CONTAINER} relative`}>
          <p className={`${part.c} max-w-[52ch] text-base font-normal leading-relaxed text-white/85 lg:text-lg ${TEXT_SHADOW}`}>
            Noleggio, acquisto e assistenza per aziende e partite IVA, da un’unica concessionaria ufficiale Volkswagen a
            Città della Pieve e Sinalunga.
          </p>
          <div className={`${part.d} mt-7 flex flex-col gap-3 sm:flex-row sm:items-center`}>
            <a href="#contatti" onFocus={onCtaFocus} className={`${BTN_PRIMARY} focus-visible:ring-offset-brand-navy`}>
              Richiedi una proposta flotta <ArrowRight size={20} strokeWidth={1.5} />
            </a>
            <a
              href="#servizi"
              onFocus={onCtaFocus}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:border-white hover:bg-white/10 motion-reduce:transition-none ${FOCUS_RING} focus-visible:ring-offset-brand-navy`}
            >
              Scopri i servizi
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroStatic() {
  const stageRef = useRef(null);
  const hz = useHorizon(stageRef);
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-brand-navy"
    >
      <div ref={stageRef} className="relative h-[100svh] min-h-[640px]">
        <img
          src={ASSETS.heroEnding}
          alt=""
          width={ASSETS.heroWidth}
          height={ASSETS.heroHeight}
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,10,30,0.55)_0%,rgba(0,10,30,0.1)_40%,rgba(0,10,30,0.2)_60%,rgba(0,10,30,0.75)_100%)]"
          aria-hidden="true"
        />
        <HeroFinalContent hz={hz} />
      </div>
    </section>
  );
}

function HeroScrub({ onFail }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const posterRef = useRef(null);
  const ringRef = useRef(null);
  const ringWrapRef = useRef(null);
  const progressRef = useRef(null);
  const cueRef = useRef(null);
  const bandRefs = useRef([]);
  const finalRef = useRef(null);
  const hz = useHorizon(stageRef);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const stage = stageRef.current;
    const ctrl = new AbortController();
    let objectUrl = null;
    let watchdog = null;
    let rafId = null;
    let lastTick = 0;
    let target = 0;
    let shown = 0;
    let heroOnScreen = true;
    let seekBusy = false;
    let pendingTime = null;
    let ready = false;
    const loadStart = performance.now();
    let loadK = 0;
    const cache = new Map();

    const heroProgress = () => {
      const r = section.getBoundingClientRect();
      const range = section.offsetHeight - window.innerHeight;
      return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
    };

    const write = (el, key, value, fmt) => {
      if (!el) return;
      const prev = cache.get(el)?.[key];
      if (prev !== undefined && Math.abs(prev - value) < 0.004) return;
      cache.set(el, { ...(cache.get(el) || {}), [key]: value });
      fmt(el, value);
    };

    const requestSeek = (t) => {
      if (!ready || !video.duration) return;
      if (seekBusy) {
        pendingTime = t;
        return;
      }
      seekBusy = true;
      video.currentTime = t;
    };
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        requestSeek(t);
      }
    };

    const updateCaptions = (p) => {
      HERO_BANDS.forEach((band, i) => {
        const [a, b] = band.range;
        const f = Math.min(0.025, (b - a) / 3);
        const fadeIn = i === 0 ? 1 : smoothstep(p, a, a + f);
        const fadeOut = 1 - smoothstep(p, b - f, b);
        const scrollK = clamp((p - a) / Math.min(0.05, (b - a) * 0.35), 0, 1);
        const k = i === 0 ? Math.max(scrollK, loadK) : scrollK;
        const el = bandRefs.current[i];
        write(el, 'o', fadeIn * fadeOut, (e, v) => {
          e.style.opacity = v.toFixed(3);
          e.style.visibility = v < 0.01 ? 'hidden' : 'visible';
        });
        write(el, 'k', k, (e, v) => e.style.setProperty('--k', v.toFixed(3)));
      });
      const [a] = HERO_FINAL_RANGE;
      const o = smoothstep(p, a, a + 0.03);
      const k = clamp((p - a) / 0.1, 0, 1);
      write(finalRef.current, 'o', o, (e, v) => {
        e.style.opacity = v.toFixed(3);
        e.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
      });
      write(finalRef.current, 'k', k, (e, v) => e.style.setProperty('--k', v.toFixed(3)));
      write(progressRef.current, 'p', p, (e, v) => {
        e.style.strokeDashoffset = (1 - v).toFixed(4);
      });
      write(cueRef.current, 'o', 1 - smoothstep(p, 0.02, 0.07), (e, v) => {
        e.style.opacity = v.toFixed(3);
      });
    };

    const tick = (now) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      loadK = easeOutCubic(clamp((now - loadStart) / 1100, 0, 1));
      const k = 0.14;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      const settled = Math.abs(target - shown) < 0.0005;
      if (settled) shown = target;
      if (ready) requestSeek(shown * Math.max(0, video.duration - 0.04));
      updateCaptions(shown);
      if (settled && loadK >= 1) {
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    const kick = () => {
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = heroProgress();
      kick();
    };

    const io = new IntersectionObserver(([e]) => {
      heroOnScreen = e.isIntersecting;
      if (heroOnScreen) onScroll();
    });
    io.observe(section);

    const fail = () => {
      clearTimeout(watchdog);
      ringWrapRef.current?.classList.add('opacity-0');
      if (posterRef.current) posterRef.current.src = ASSETS.heroEnding;
      stage.dataset.state = 'failed';
      onFail?.();
    };

    /* Il video arriva come Blob: niente dipendenza dal supporto HTTP Range del server. */
    const loadBlob = async () => {
      const arm = () => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => ctrl.abort(), 20000);
      };
      arm();
      const res = await fetch(ASSETS.heroVideo, { priority: 'low', signal: ctrl.signal });
      if (!res.ok || !res.body) throw new Error(`video ${res.status}`);
      const total = Number(res.headers.get('Content-Length')) || ASSETS.heroVideoBytes;
      const reader = res.body.getReader();
      const chunks = [];
      let got = 0;
      let lastRing = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        arm();
        chunks.push(value);
        got += value.length;
        const frac = Math.min(1, got / total);
        const now = performance.now();
        if (now - lastRing > 100 || frac === 1) {
          lastRing = now;
          ringRef.current?.style.setProperty('stroke-dashoffset', (1 - frac).toFixed(3));
        }
      }
      clearTimeout(watchdog);
      ringRef.current?.style.setProperty('stroke-dashoffset', '0');
      objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
      video.src = objectUrl;
      video.load();
    };

    const onCanPlay = () => {
      ready = true;
      stage.dataset.state = 'ready';
      ringWrapRef.current?.classList.add('opacity-0');
      requestSeek(heroProgress() * Math.max(0, video.duration - 0.04));
    };
    const onVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      if (!ready) fail();
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('error', onVideoError);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* Il poster vince la gara di banda: il Blob parte dopo il poster (o dopo 4s) */
    let started = false;
    const start = () => {
      if (started || ctrl.signal.aborted) return;
      started = true;
      loadBlob().catch((err) => {
        if (err?.name === 'AbortError' && ctrl.signal.reason === 'unmount') return;
        fail();
      });
    };
    const posterImg = posterRef.current;
    if (posterImg?.complete) start();
    else posterImg?.addEventListener('load', start, { once: true });
    posterImg?.addEventListener('error', start, { once: true });
    const safety = setTimeout(start, 4000);

    onScroll();
    kick();

    return () => {
      ctrl.abort('unmount');
      clearTimeout(watchdog);
      clearTimeout(safety);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onVideoError);
      posterImg?.removeEventListener('load', start);
      posterImg?.removeEventListener('error', start);
      if (rafId !== null) cancelAnimationFrame(rafId);
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onFail]);

  /* Se il focus da tastiera cade sulle CTA finali, porta la hero al suo finale */
  const revealFinal = useCallback(() => {
    const s = sectionRef.current;
    if (!s) return;
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + s.offsetHeight - window.innerHeight, behavior: 'auto' });
  }, []);

  return (
    <section ref={sectionRef} id="top" aria-labelledby="hero-title" className="relative h-[460vh] bg-brand-navy">
      <div ref={stageRef} data-state="loading" className="group/stage sticky top-0 h-[100svh] overflow-hidden">
        <img
          ref={posterRef}
          src={ASSETS.heroPoster}
          alt=""
          width={ASSETS.heroWidth}
          height={ASSETS.heroHeight}
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <video
          ref={videoRef}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 [transform:translateZ(0)] group-data-[state=ready]/stage:opacity-100"
        />
        {/* Scrim globale: scurisce il lato sinistro dove vivono le didascalie */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,10,30,0.62)_0%,rgba(0,10,30,0.25)_45%,rgba(0,10,30,0)_70%),linear-gradient(180deg,rgba(0,10,30,0.5)_0%,rgba(0,10,30,0)_22%)]"
        />

        {/* Didascalie: entrano da destra come le scie di luce che corrono verso l'orizzonte */}
        {HERO_BANDS.map((band, i) => (
          <div
            key={band.eyebrow}
            ref={(el) => {
              bandRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-0 flex items-start pt-[20vh] [--k:0]"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}
          >
            <div className={`${CONTAINER} relative`}>
              <div
                aria-hidden="true"
                className="absolute -left-[10%] -top-[40%] h-[180%] w-[80%] bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,10,30,0.66)_0%,rgba(0,10,30,0.4)_45%,rgba(0,10,30,0)_75%)] [opacity:calc(0.3+0.7*var(--k))]"
              />
              <p
                className={`${EYEBROW} relative mb-6 text-white/80 ${TEXT_SHADOW} [opacity:var(--k)] [transform:translateX(calc((1_-_var(--k))_*_2rem))]`}
              >
                {band.eyebrow}
              </p>
              <p className={`relative text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-6xl ${TEXT_SHADOW}`}>
                {band.lines.map((line, li) => (
                  <span
                    key={line}
                    className="block [--kc:clamp(0,calc((var(--k)_-_var(--th))_*_2.4),1)] [opacity:var(--kc)] [transform:translateX(calc((1_-_var(--kc))_*_4rem))]"
                    style={{ '--th': li * 0.16 }}
                  >
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ))}

        {/* Finale: headline sopra la linea d'orizzonte, promessa e CTA sotto */}
        <div
          ref={finalRef}
          className="absolute inset-0 [--k:0]"
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          <HeroFinalContent hz={hz} onCtaFocus={revealFinal} animated />
        </div>

        {/* Indicatore di progresso: la linea firma si disegna con lo scroll */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6" aria-hidden="true">
          <div className={`${CONTAINER} flex items-center gap-4`}>
            <span ref={cueRef} className={`${EYEBROW} flex shrink-0 items-center gap-2 text-white/80`}>
              Scorri
              <ChevronDown size={20} strokeWidth={1.5} className="animate-bounce motion-reduce:animate-none" />
            </span>
            <svg width="100%" height="4" className="block overflow-visible drop-shadow-[0_0_6px_rgba(0,102,255,0.6)]">
              <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <line
                ref={progressRef}
                x1="0"
                y1="2"
                x2="100%"
                y2="2"
                pathLength="1"
                stroke="#0066FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="1 1"
                strokeDashoffset="1"
              />
            </svg>
            {/* Anello di caricamento del video */}
            <span ref={ringWrapRef} className="flex shrink-0 items-center gap-2 text-white/70 transition-opacity duration-500">
              <svg viewBox="0 0 48 48" className="h-6 w-6 -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  ref={ringRef}
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#0066FF"
                  strokeWidth="3"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  const mode = useHeroMode();
  if (mode === 'static') return <HeroStatic />;
  return <HeroScrub />;
}

/* ------------------------------------------------------------------ */
/* 1. Servizi per le aziende (bento)                                   */
/* ------------------------------------------------------------------ */
function ServiceCard({ service, className = '', delay = 0 }) {
  const Icon = service.icon;
  return (
    <Reveal delay={delay} className={className}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-navy/10 bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_rgba(0,30,80,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-navy">
          <img
            src={service.image}
            alt={service.alt}
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <Icon size={28} strokeWidth={1.5} className="text-brand-blue" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-brand-navy">{service.title}</h3>
          <span
            aria-hidden="true"
            className="mt-2 block h-px w-16 origin-left scale-x-0 bg-brand-blue transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
          />
          <p className="mt-3 text-base leading-relaxed text-brand-slate">{service.benefit}</p>
        </div>
      </article>
    </Reveal>
  );
}

function FleetCard({ onRequest }) {
  const [mode, setMode] = useState('noleggio');
  const baseId = useId();
  const tabsRef = useRef([]);
  const keys = Object.keys(FLEET_MODES);

  const onKeyDown = (e) => {
    const i = keys.indexOf(mode);
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % keys.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length;
    if (next === null) return;
    e.preventDefault();
    setMode(keys[next]);
    tabsRef.current[next]?.focus();
  };

  return (
    <Reveal className="lg:col-span-4 lg:row-span-2">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-brand-navy text-white shadow-[0_30px_80px_-20px_rgba(0,30,80,0.35)]">
        <img
          src="/assets/card-flotte.webp"
          alt="Fila ordinata di auto aziendali bianche, senza marchi, in un parcheggio coperto di notte con una linea di luce blu sul pavimento"
          width="1600"
          height="1200"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,30,80,0.25)_0%,rgba(0,30,80,0.55)_45%,rgba(0,20,56,0.94)_100%)]"
        />
        <div className="relative flex flex-1 flex-col justify-between gap-10 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className={`${EYEBROW} inline-flex items-center gap-2 text-white/85`}>
              <Building2 size={20} strokeWidth={1.5} aria-hidden="true" /> Flotte aziendali
            </span>
            {/* Toggle Noleggio / Acquisto: l'elemento che il visitatore usa */}
            <div
              role="tablist"
              aria-label="Tipo di flotta"
              onKeyDown={onKeyDown}
              className="relative grid grid-cols-2 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white transition-transform duration-500 ease-out motion-reduce:transition-none ${
                  mode === 'acquisto' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              {keys.map((k, i) => (
                <button
                  key={k}
                  ref={(el) => {
                    tabsRef.current[i] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`${baseId}-tab-${k}`}
                  aria-selected={mode === k}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={mode === k ? 0 : -1}
                  onClick={() => setMode(k)}
                  className={`relative min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors duration-500 ${FOCUS_RING} focus-visible:ring-offset-brand-navy ${
                    mode === k ? 'text-brand-navy' : 'text-white/85 hover:text-white'
                  }`}
                >
                  {FLEET_MODES[k].label}
                </button>
              ))}
            </div>
          </div>

          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${mode}`}
            aria-live="polite"
            className="grid"
          >
            {keys.map((k) => {
              const m = FLEET_MODES[k];
              const active = mode === k;
              return (
                <div
                  key={k}
                  aria-hidden={!active}
                  className={`[grid-area:1/1] transition duration-500 ease-out motion-reduce:transition-none ${
                    active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                  }`}
                >
                  <h3 className="max-w-[18ch] text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    {m.title}
                  </h3>
                  <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-white/85 lg:text-lg">{m.text}</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    {m.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm font-semibold text-white">
                        <CheckCircle2 size={20} strokeWidth={1.5} className="mt-px shrink-0 text-white/80" aria-hidden="true" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    tabIndex={active ? 0 : -1}
                    onClick={() => onRequest(m.interest)}
                    className={`${BTN_PRIMARY} mt-8 focus-visible:ring-offset-brand-navy`}
                  >
                    Richiedi una proposta flotta <ArrowRight size={20} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function ServicesSection({ onRequest }) {
  return (
    <section id="servizi" aria-labelledby="servizi-title" className="scroll-mt-16 bg-brand-mist py-24 lg:py-32">
      <div className={CONTAINER}>
        <SectionMarker index="01" label="Servizi" />
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className={`${EYEBROW} text-brand-blue`}>Per aziende e partite IVA</p>
            <h2 id="servizi-title" className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
              Tutto quello che serve alla flotta, in un posto solo.
            </h2>
          </Reveal>
          <Reveal delay={1} className="lg:col-span-5">
            <p className="max-w-[52ch] text-base leading-relaxed text-brand-slate lg:text-lg">
              Dal noleggio all’officina, ogni veicolo dell’azienda passa dalla stessa concessionaria ufficiale Volkswagen.
              Un contratto chiaro, un posto dove portare l’auto, persone che conosci per nome.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid auto-rows-auto gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <FleetCard onRequest={onRequest} />
          <ServiceCard service={SERVICES[0]} className="lg:col-span-2" delay={1} />
          <ServiceCard service={SERVICES[1]} className="lg:col-span-2" delay={2} />
          <ServiceCard service={SERVICES[2]} className="lg:col-span-2" delay={0} />
          <ServiceCard service={SERVICES[3]} className="lg:col-span-2" delay={1} />
          <ServiceCard service={SERVICES[4]} className="sm:col-span-2 lg:col-span-2" delay={2} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Veicoli disponibili                                             */
/* ------------------------------------------------------------------ */
const STATE_TABS = ['Tutti', 'Nuovo', 'Km0', 'Usato Certificato'];
const SORTS = [
  { id: 'price-asc', label: 'Prezzo crescente' },
  { id: 'price-desc', label: 'Prezzo decrescente' },
  { id: 'recent', label: 'Più recenti' },
];
const PAGE_SIZE = 6;
const EMISSION_LABELS = { EURO6: 'Euro 6', ZERO_EMISSION: 'Zero emissioni' };
const formatEuro = (n) => `€ ${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(n)}`;
const formatKm = (n) => `${new Intl.NumberFormat('it-IT').format(n)} km`;
/* La versione di alcuni nuovi ripete il modello ("Polo Young 1.0...", "Nuova ID. Polo Trend..."):
   in visualizzazione tolgo il modello ripetuto in testa, il dato resta invariato */
const displayVersion = (v) => {
  if (!v.versione || !v.modello) return v.versione;
  const i = v.versione.toLowerCase().indexOf(v.modello.toLowerCase() + ' ');
  return i >= 0 && i <= 6 ? v.versione.slice(i + v.modello.length + 1) : v.versione;
};
const vehicleLabel = (v) => [v.modello, displayVersion(v)].filter(Boolean).join(' ') + (v.stato ? ` · ${v.stato}` : '');
const vehicleAlt = (v) =>
  `${[v.marca, v.modello].filter(Boolean).join(' ')}${v.colore ? `, colore ${v.colore.toLowerCase()}` : ''}`;
/* anno + mese di immatricolazione quando c'è, per ordinare "Più recenti" */
const recency = (v) => {
  const m = v.immatricolazione?.match(/^(\d{2})\/(\d{4})$/);
  return m ? Number(m[2]) * 12 + Number(m[1]) : (v.anno || 0) * 12 + 12;
};

/* Stock: feed del cliente se configurato, altrimenti i dati estratti */
function useVehicles() {
  const [state, setState] = useState(() =>
    CONFIG.vehiclesFeedUrl ? { status: 'loading', items: [] } : { status: 'ready', items: VEHICLES },
  );
  useEffect(() => {
    if (!CONFIG.vehiclesFeedUrl) return undefined;
    const ctrl = new AbortController();
    fetch(CONFIG.vehiclesFeedUrl, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const items = Array.isArray(json) ? json : json?.veicoli || [];
        setState({ status: 'ready', items: items.filter((v) => v && v.id && v.stato) });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', items: [] });
      });
    return () => ctrl.abort();
  }, []);
  return state;
}

/* Silhouette neutra quando manca la foto */
function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,#001E50_0%,#0A2A63_100%)] text-white/80">
      <svg viewBox="0 0 160 60" className="w-2/3 max-w-[220px]" aria-hidden="true">
        <path
          d="M8 44c0-6 4-9 10-10l18-3 16-12c4-3 9-5 15-5h30c6 0 11 2 15 6l14 12 16 3c6 1 10 5 10 11v4H8z"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="42" cy="48" r="8" fill="#001E50" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        <circle cx="118" cy="48" r="8" fill="#001E50" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        <line x1="8" y1="57" x2="152" y2="57" stroke="#0066FF" strokeWidth="1.5" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.25em]">Foto in arrivo</span>
    </div>
  );
}

const STATE_BADGE = {
  Nuovo: 'bg-brand-blue text-white',
  Km0: 'bg-brand-navy text-white',
  'Usato Certificato': 'border border-white/60 bg-white/80 text-brand-navy backdrop-blur-md',
};

function VehicleCard({ v, onRequest }) {
  const [imgFailed, setImgFailed] = useState(!v.foto?.length);
  const [shown, setShown] = useState(false);
  const titleId = useId();
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const FuelIcon = /elettric/i.test(v.alimentazione || '') ? Zap : Fuel;
  const specs = [
    (v.immatricolazione || v.anno) && { icon: Calendar, label: 'Anno', value: v.immatricolazione || String(v.anno) },
    v.km != null && { icon: Gauge, label: 'Chilometri', value: formatKm(v.km) },
    v.alimentazione && { icon: FuelIcon, label: 'Alimentazione', value: v.alimentazione },
    v.cambio && { icon: Cog, label: 'Cambio', value: v.cambio },
  ].filter(Boolean);
  const emissions = [
    v.consumoCombinato && `Consumo combinato ${v.consumoCombinato}`,
    v.emissioniCo2 && `CO2 ${v.emissioniCo2}`,
    v.classeEmissione && (EMISSION_LABELS[v.classeEmissione] || v.classeEmissione),
  ].filter(Boolean);
  const version = displayVersion(v);

  return (
    <article
      aria-labelledby={titleId}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-navy/10 bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_rgba(0,30,80,0.35)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-navy">
        {imgFailed ? (
          <PhotoPlaceholder />
        ) : (
          <img
            src={v.foto[0]}
            alt={vehicleAlt(v)}
            width="800"
            height="500"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        {v.stato && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${STATE_BADGE[v.stato] || STATE_BADGE.Nuovo}`}>
            {v.stato}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className={`${EYEBROW} text-brand-navy/70`}>{v.marca}</p>
        <h3 id={titleId} className="mt-2 text-2xl font-bold tracking-tight text-brand-navy">
          {v.modello}
        </h3>
        <span
          aria-hidden="true"
          className="mt-2 block h-px w-16 origin-left scale-x-0 bg-brand-blue transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
        />
        {version && <p className="mt-2 text-sm leading-snug text-brand-slate">{version}</p>}

        {specs.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-slate">
            {specs.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-1.5">
                  <dt className="sr-only">{s.label}</dt>
                  <Icon size={16} strokeWidth={1.5} className="shrink-0 text-brand-blue" aria-hidden="true" />
                  <dd>{s.value}</dd>
                </div>
              );
            })}
          </dl>
        )}

        <div className="mt-auto pt-5">
          <div className="border-t border-brand-navy/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-slate/90">Prezzo</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatEuro(v.prezzo)}</p>
            {v.prezzoNota && <p className="mt-0.5 text-xs text-brand-slate">{v.prezzoNota}</p>}
            {v.canoneMensile != null && v.canoneNota && (
              <p className="mt-2 text-sm text-brand-slate">
                <span className="font-semibold text-brand-navy">{formatEuro(v.canoneMensile)} al mese</span>
                <span className="block text-xs">{v.canoneNota}</span>
              </p>
            )}
            {emissions.length > 0 && <p className="mt-3 text-xs leading-relaxed text-brand-slate">{emissions.join(' · ')}</p>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => onRequest('Veicolo specifico', { id: v.id, label: vehicleLabel(v) })}
              className={`${BTN_PRIMARY} !min-h-[44px] !px-5 !py-2.5`}
              aria-describedby={titleId}
            >
              Richiedi informazioni <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
            {v.urlScheda && (
              <a
                href={v.urlScheda}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[44px] items-center gap-1 rounded text-sm font-semibold text-brand-navy underline-offset-4 hover:text-brand-blue hover:underline ${FOCUS_RING}`}
              >
                Scheda completa <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">di {v.marca} {v.modello}, si apre in una nuova scheda</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function VehiclesEmpty({ filtered, error, onReset, onRequest }) {
  return (
    <div className="flex flex-col items-start gap-6 rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-[0_30px_80px_-20px_rgba(0,30,80,0.25)] sm:flex-row sm:items-center sm:p-10">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-ice text-brand-blue">
        <Car size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-xl font-semibold tracking-tight text-brand-navy">
          {filtered ? 'Nessuna auto con questi filtri.' : 'Lo stock cambia spesso.'}
        </p>
        <p className="mt-2 max-w-[56ch] text-base leading-relaxed text-brand-slate">
          {error ? 'Al momento non riusciamo a caricare le auto disponibili. ' : ''}
          Dicci cosa cerchi e ti segnaliamo le auto disponibili appena arrivano.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {filtered && (
          <button
            type="button"
            onClick={onReset}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brand-navy/20 px-5 text-sm font-semibold text-brand-navy transition hover:border-brand-navy ${FOCUS_RING}`}
          >
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" /> Azzera filtri
          </button>
        )}
        <button type="button" onClick={() => onRequest('Ricerca veicolo')} className={`${BTN_PRIMARY} !min-h-[44px] !px-5 !py-2.5`}>
          Dicci cosa cerchi <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function VehiclesSection({ onRequest }) {
  const { status, items } = useVehicles();
  const reduced = usePrefersReducedMotion();
  const [tab, setTab] = useState('Tutti');
  const [fuel, setFuel] = useState(null);
  const [sort, setSort] = useState('price-asc');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const tabsRef = useRef([]);
  const listRef = useRef(null);
  const baseId = useId();

  /* Tab visibili: solo stati con almeno un veicolo */
  const counts = useMemo(() => {
    const c = { Tutti: items.length };
    items.forEach((v) => (c[v.stato] = (c[v.stato] || 0) + 1));
    return c;
  }, [items]);
  const tabs = STATE_TABS.filter((t) => counts[t] > 0);

  /* Chip alimentazione: valori reali presenti nei dati del tab corrente */
  const inTab = useMemo(() => (tab === 'Tutti' ? items : items.filter((v) => v.stato === tab)), [items, tab]);
  const fuels = useMemo(() => {
    const c = {};
    inTab.forEach((v) => v.alimentazione && (c[v.alimentazione] = (c[v.alimentazione] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [inTab]);

  const filtered = useMemo(() => {
    const list = fuel ? inTab.filter((v) => v.alimentazione === fuel) : [...inTab];
    if (sort === 'price-asc') list.sort((a, b) => a.prezzo - b.prezzo);
    if (sort === 'price-desc') list.sort((a, b) => b.prezzo - a.prezzo);
    if (sort === 'recent') list.sort((a, b) => recency(b) - recency(a) || a.prezzo - b.prezzo);
    return list;
  }, [inTab, fuel, sort]);

  /* Transizione al cambio filtro: la lista esce, cambia e rientra; l'altezza resta riservata */
  const filterKey = `${tab}|${fuel}|${sort}`;
  const [shownKey, setShownKey] = useState(filterKey);
  const [phase, setPhase] = useState('in');
  const [lockedHeight, setLockedHeight] = useState(null);
  useEffect(() => {
    if (filterKey === shownKey) return undefined;
    if (reduced) {
      setShownKey(filterKey);
      setLimit(PAGE_SIZE);
      return undefined;
    }
    setLockedHeight(listRef.current?.offsetHeight || null);
    setPhase('out');
    const t1 = setTimeout(() => {
      setShownKey(filterKey);
      setLimit(PAGE_SIZE);
      setPhase('in');
    }, 220);
    const t2 = setTimeout(() => setLockedHeight(null), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [filterKey, shownKey, reduced]);

  const [visibleList, setVisibleList] = useState(filtered);
  useEffect(() => {
    if (shownKey === filterKey) setVisibleList(filtered);
  }, [shownKey, filterKey, filtered]);
  const visible = visibleList.slice(0, limit);

  /* Carosello mobile: indicatore di posizione */
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    let raf = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const first = el.firstElementChild;
        if (!first) return;
        const step = first.getBoundingClientRect().width + 16;
        setSlide(Math.round(el.scrollLeft / step));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);
  useEffect(() => {
    listRef.current?.scrollTo({ left: 0 });
    setSlide(0);
  }, [shownKey]);
  const scrollSlide = (dir) => {
    const el = listRef.current;
    const first = el?.firstElementChild;
    if (!first) return;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + 16), behavior: reduced ? 'auto' : 'smooth' });
  };

  const onTabKey = (e) => {
    const i = tabs.indexOf(tab);
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (next === null) return;
    e.preventDefault();
    setTab(tabs[next]);
    setFuel(null);
    tabsRef.current[next]?.focus();
  };
  const resetFilters = () => {
    setTab('Tutti');
    setFuel(null);
    setSort('price-asc');
  };

  const filtersActive = tab !== 'Tutti' || fuel !== null;
  const updated =
    VEHICLES_UPDATED && !CONFIG.vehiclesFeedUrl && items.length > 0 ? VEHICLES_UPDATED.toLocaleDateString('it-IT') : null;

  return (
    <section id="veicoli" aria-labelledby="veicoli-title" className="scroll-mt-16 bg-brand-ice py-24 lg:py-32">
      <div className={CONTAINER}>
        <SectionMarker index="02" label="Veicoli" />
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className={`${EYEBROW} text-brand-blue`}>Disponibili subito</p>
            <h2 id="veicoli-title" className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight text-brand-slate sm:text-5xl lg:text-6xl">
              Pronte in <span className="text-brand-navy">concessionaria</span>, non in catalogo.
            </h2>
            <SignatureLine className="mt-6 max-w-md" />
          </Reveal>
          <Reveal delay={1} className="lg:col-span-5">
            <p className="max-w-[52ch] text-base leading-relaxed text-brand-slate lg:text-lg">
              Nuove in pronta consegna e Usato Certificato. Scegli un’auto, per te o per la flotta, e ti prepariamo una
              proposta per la tua azienda.
            </p>
          </Reveal>
        </div>

        {status === 'loading' && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Caricamento veicoli">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[520px] animate-pulse rounded-2xl bg-white/70 motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {status !== 'loading' && items.length === 0 && (
          <div className="mt-12">
            <VehiclesEmpty error={status === 'error'} onRequest={onRequest} />
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            {/* Filtri */}
            <div className="mt-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label="Stato del veicolo"
                onKeyDown={onTabKey}
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
              >
                {tabs.map((t, i) => (
                  <button
                    key={t}
                    ref={(el) => {
                      tabsRef.current[i] = el;
                    }}
                    role="tab"
                    type="button"
                    id={`${baseId}-tab-${i}`}
                    aria-selected={tab === t}
                    aria-controls={`${baseId}-list`}
                    tabIndex={tab === t ? 0 : -1}
                    onClick={() => {
                      setTab(t);
                      setFuel(null);
                    }}
                    className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-300 motion-reduce:transition-none ${FOCUS_RING} ${
                      tab === t ? 'bg-brand-navy text-white' : 'border border-brand-navy/15 bg-white text-brand-navy hover:border-brand-navy/40'
                    }`}
                  >
                    {t}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${tab === t ? 'bg-white/15 text-white' : 'bg-brand-ice text-brand-navy'}`}
                    >
                      {counts[t]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative self-start lg:self-auto">
                <label htmlFor={`${baseId}-sort`} className="sr-only">
                  Ordina per
                </label>
                <select
                  id={`${baseId}-sort`}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={`min-h-[44px] appearance-none rounded-full border border-brand-navy/15 bg-white py-2 pl-5 pr-11 text-sm font-semibold text-brand-navy hover:border-brand-navy/40 ${FOCUS_RING}`}
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy/70" aria-hidden="true" />
              </div>
            </div>

            {fuels.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Alimentazione">
                {fuels.map(([f, n]) => {
                  const active = fuel === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFuel(active ? null : f)}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors duration-300 motion-reduce:transition-none ${FOCUS_RING} ${
                        active ? 'bg-brand-blue text-white' : 'border border-brand-navy/15 bg-white/70 text-brand-navy hover:border-brand-navy/40'
                      }`}
                    >
                      {f}
                      <span className={active ? 'text-white/85' : 'text-brand-slate/90'}>{n}</span>
                      {active && <X size={14} strokeWidth={1.5} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-6 text-sm text-brand-slate" aria-live="polite">
              {filtered.length === 0
                ? 'Nessun veicolo con questi filtri'
                : `${Math.min(limit, filtered.length)} di ${filtered.length} ${filtered.length === 1 ? 'veicolo' : 'veicoli'}`}
            </p>

            {/* Lista: carosello su mobile, griglia da tablet */}
            <div
              className={`transition duration-200 ease-out motion-reduce:transition-none ${
                phase === 'out' ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
              }`}
              style={lockedHeight ? { minHeight: `${lockedHeight}px` } : undefined}
            >
              {visible.length === 0 ? (
                <div className="mt-4">
                  <VehiclesEmpty filtered onReset={resetFilters} onRequest={onRequest} />
                </div>
              ) : (
                <>
                  <ul
                    ref={listRef}
                    id={`${baseId}-list`}
                    role="list"
                    tabIndex={0}
                    aria-label="Veicoli disponibili"
                    className={`-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden ${FOCUS_RING} focus-visible:ring-offset-brand-ice`}
                  >
                    {visible.map((v) => (
                      <li key={v.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
                        <VehicleCard v={v} onRequest={onRequest} />
                      </li>
                    ))}
                  </ul>

                  {/* Indicatore e frecce del carosello, solo mobile */}
                  {visible.length > 1 && (
                    <div className="mt-2 flex items-center justify-between sm:hidden">
                      <p className="text-sm font-semibold tabular-nums text-brand-navy" aria-hidden="true">
                        {Math.min(slide + 1, visible.length)} / {visible.length}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => scrollSlide(-1)}
                          aria-label="Veicolo precedente"
                          disabled={slide <= 0}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-navy/15 bg-white text-brand-navy disabled:opacity-40 ${FOCUS_RING}`}
                        >
                          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollSlide(1)}
                          aria-label="Veicolo successivo"
                          disabled={slide >= visible.length - 1}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-navy/15 bg-white text-brand-navy disabled:opacity-40 ${FOCUS_RING}`}
                        >
                          <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  {filtered.length > limit && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setLimit((l) => l + PAGE_SIZE)}
                        className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border border-brand-navy/20 bg-white px-7 text-sm font-semibold text-brand-navy transition hover:border-brand-navy ${FOCUS_RING}`}
                      >
                        Mostra altri <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="mt-12 flex flex-col gap-3 border-t border-brand-navy/10 pt-6 text-sm text-brand-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            {updated ? `Dati e foto da rubeca.it, aggiornati al ${updated}. ` : ''}
            Prezzi e disponibilità da confermare in concessionaria.
          </p>
          <a
            href={CONFIG.stockUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-[44px] items-center gap-1 rounded font-semibold text-brand-navy hover:text-brand-blue ${FOCUS_RING}`}
          >
            Vedi tutto lo stock su rubeca.it <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">(si apre in una nuova scheda)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Fiducia                                                         */
/* ------------------------------------------------------------------ */
function Counter({ value, run }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced || !run) {
      el.textContent = run || reduced ? String(value) : '0';
      return undefined;
    }
    let raf = null;
    const t0 = performance.now();
    const dur = 1600;
    let last = '';
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const txt = String(Math.round(easeOutCubic(t) * value));
      if (txt !== last) {
        last = txt;
        el.textContent = txt;
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, run, reduced]);
  return (
    <span ref={ref} aria-hidden="true">
      0
    </span>
  );
}

function TrustSection() {
  const statsRef = useRef(null);
  const statsIn = useInView(statsRef, { threshold: 0.4 });

  return (
    <section id="perche-noi" aria-labelledby="perche-noi-title" className="relative scroll-mt-16 overflow-hidden bg-brand-navy py-24 text-white lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/4 top-0 h-[70%] w-[80%] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.16)_0%,rgba(0,102,255,0)_65%)] motion-safe:animate-[pulse_9s_ease-in-out_infinite]"
      />
      <div className={`${CONTAINER} relative`}>
        <SectionMarker index="03" label="Perché noi" dark />

        {/* Fascia numerica: solo dati verificati */}
        <dl ref={statsRef} className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i} className="border-t border-white/15 pt-6">
              <dt className="sr-only">{`${s.value} ${s.label}`}</dt>
              <dd>
                <span className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold tabular-nums tracking-tight lg:text-8xl">
                    <Counter value={s.value} run={statsIn} />
                  </span>
                  <span className="text-lg font-semibold text-white lg:text-xl">{s.label}</span>
                </span>
                <span className="mt-3 block max-w-[32ch] text-base leading-relaxed text-white/75">{s.caption}</span>
              </dd>
            </Reveal>
          ))}
        </dl>

        {/* Perché le aziende scelgono Rubeca */}
        <div className="mt-24 grid gap-12 lg:mt-32 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className={`${EYEBROW} text-white/75`}>Chi gestisce una flotta lo sa</p>
                <h2 id="perche-noi-title" className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                  Perché le aziende scelgono{' '}
                  <span className="bg-gradient-to-r from-white to-brand-blue bg-clip-text text-transparent">Rubeca.</span>
                </h2>
                <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-white/80 lg:text-lg">
                  Tre problemi che chi gestisce una flotta conosce bene. E come li affrontiamo.
                </p>
              </Reveal>
              <Reveal delay={1} className="mt-10">
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <Leaf size={28} strokeWidth={1.5} className="shrink-0 text-white" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Sustainability Award{CONFIG.sustainabilityAwardYear ? ` ${CONFIG.sustainabilityAwardYear}` : ''}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      Il riconoscimento ricevuto per l’impegno ambientale della concessionaria.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <ol className="lg:col-span-7">
            {REASONS.map((r, i) => (
              <Reveal as="li" key={r.objection} delay={i} className="group border-t border-white/15 py-10 first:pt-0 first:border-t-0 lg:first:pt-2">
                <div className="flex gap-6">
                  <span className="text-sm font-semibold tabular-nums text-white/70" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold leading-snug tracking-tight lg:text-3xl">{r.objection}</h3>
                    <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-white/80 lg:text-lg">{r.answer}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* DA VERIFICARE: inserire solo testimonianze reali autorizzate. Non renderizzato finché è vuoto. */}
        {CONFIG.testimonials.length > 0 && (
          <div className="mt-24 grid gap-6 md:grid-cols-2">
            {CONFIG.testimonials.map((t) => (
              <figure key={t.author} className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <blockquote className="text-lg leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-6 text-sm text-white/75">
                  {t.author}, {t.company}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {CONFIG.clientLogos.length > 0 && (
          <ul className="mt-16 flex flex-wrap items-center gap-10" aria-label="Alcune aziende clienti">
            {CONFIG.clientLogos.map((l) => (
              <li key={l.name}>
                <img src={l.src} alt={l.name} width={l.width} height={l.height} loading="lazy" className="h-8 w-auto brightness-0 invert" />
              </li>
            ))}
          </ul>
        )}

        {/* Sedi */}
        <div id="sedi" className="mt-24 scroll-mt-24 lg:mt-32">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Due sedi, un solo referente.</h2>
            <p className="flex items-center gap-2 text-sm text-white/75">
              <Award size={20} strokeWidth={1.5} aria-hidden="true" /> Concessionaria ufficiale Volkswagen
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {CONFIG.locations.map((loc, i) => (
              <Reveal key={loc.city} delay={i}>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex h-full items-start justify-between gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:border-white/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCUS_RING} focus-visible:ring-offset-brand-navy`}
                >
                  <div>
                    <p className={`${EYEBROW} text-white/70`}>{loc.role}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {loc.city} <span className="text-white/70">({loc.province})</span>
                    </p>
                    {loc.address && <p className="mt-2 text-base text-white/80">{loc.address}</p>}
                    <span className="mt-4 block h-px w-16 origin-left scale-x-0 bg-brand-blue transition-transform duration-700 group-hover:scale-x-100 motion-reduce:transition-none" aria-hidden="true" />
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-white/85 group-hover:text-white">
                    <MapPin size={20} strokeWidth={1.5} aria-hidden="true" />
                    Mappa
                    <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" />
                    <span className="sr-only">di {loc.city}, si apre in una nuova scheda</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Modulo di contatto                                              */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = { name: '', company: '', email: '', phone: '', vehicles: '', interest: '', message: '', privacy: false };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Scrivi nome e cognome.';
  if (!v.company.trim()) e.company = 'Scrivi il nome dell’azienda.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Serve un indirizzo email valido, ad esempio nome@azienda.it.';
  if (v.phone.replace(/[^\d]/g, '').length < 6) e.phone = 'Scrivi un numero di telefono valido.';
  if (!v.vehicles) e.vehicles = 'Scegli quanti veicoli ti servono.';
  if (!v.interest) e.interest = 'Scegli cosa ti interessa.';
  if (!v.privacy) e.privacy = 'Per inviare la richiesta serve il consenso al trattamento dei dati.';
  return e;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-navy">
        {label}
        {optional && <span className="font-normal text-brand-slate/80"> (facoltativo)</span>}
      </label>
      <div className="relative mt-2">
        {children}
        {/* La linea firma nel focus del campo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-brand-blue transition-transform duration-500 ease-out peer-focus:scale-x-100 motion-reduce:transition-none"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-[#B42318]">
          <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function ContactSection({ prefill }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [submittedName, setSubmittedName] = useState('');
  const formRef = useRef(null);
  const statusRef = useRef(null);

  const [vehicle, setVehicle] = useState(null); // veicolo scelto da una card: { id, label }
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    if (!prefill) return undefined;
    if (prefill.interest) setValues((v) => ({ ...v, interest: prefill.interest }));
    setVehicle(prefill.vehicle || null);
    /* Focus sul primo campo ancora vuoto, a scroll concluso */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => {
      const v = { ...valuesRef.current, interest: prefill.interest || valuesRef.current.interest };
      const key = ['name', 'company', 'email', 'phone', 'vehicles', 'interest'].find((k) => !v[k]) || 'message';
      document.getElementById(`f-${key}`)?.focus({ preventScroll: true });
    }, reduced ? 50 : 650);
    return () => clearTimeout(t);
  }, [prefill]);

  const clearVehicle = () => {
    setVehicle(null);
    setValues((v) => (v.interest === 'Veicolo specifico' ? { ...v, interest: '' } : v));
    document.getElementById('f-interest')?.focus();
  };

  useEffect(() => {
    if (status === 'success' || status === 'error') statusRef.current?.focus();
  }, [status]);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstKey = Object.keys(EMPTY_FORM).find((k) => found[k]);
    if (firstKey) {
      formRef.current?.querySelector(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      if (CONFIG.formEndpoint) {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            ...values,
            vehicleId: vehicle?.id ?? null,
            vehicleDescription: vehicle?.label ?? null,
            source: 'homepage-flotte',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
      setSubmittedName(values.name.trim().split(/\s+/)[0]);
      setValues(EMPTY_FORM);
      setVehicle(null);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputCls = (key) =>
    `peer block w-full rounded-xl border bg-white px-4 py-3 text-base text-brand-slate placeholder:text-brand-slate/60 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-blue/25 ${
      errors[key] ? 'border-[#B42318]' : 'border-brand-navy/15 hover:border-brand-navy/30 focus:border-brand-blue'
    }`;
  const aria = (key) => ({
    name: key,
    id: `f-${key}`,
    'aria-invalid': errors[key] ? 'true' : 'false',
    'aria-describedby': errors[key] ? `f-${key}-error` : undefined,
  });

  return (
    <section id="contatti" aria-labelledby="contatti-title" className="scroll-mt-16 bg-brand-ice py-24 lg:py-32">
      <div className={CONTAINER}>
        <SectionMarker index="04" label="Contatti" />
        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <p className={`${EYEBROW} text-brand-blue`}>Proposta flotta</p>
              <h2 id="contatti-title" className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
                Raccontaci la tua flotta.
              </h2>
              <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-brand-slate lg:text-lg">
                Quanti veicoli, per quale lavoro, da quando. Con queste risposte prepariamo una proposta con noleggio e acquisto
                messi a confronto.
              </p>
            </Reveal>
            <ul className="mt-10 space-y-5">
              {CONFIG.guarantees.map((g, i) => {
                const Icon = g.icon;
                return (
                  <Reveal as="li" key={g.text} delay={i + 1} className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-blue shadow-[0_10px_30px_-12px_rgba(0,30,80,0.35)]">
                      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="text-base font-semibold text-brand-navy">{g.text}</span>
                  </Reveal>
                );
              })}
            </ul>
            {(CONFIG.phone || CONFIG.email) && (
              <Reveal delay={4} className="mt-10 space-y-2 border-t border-brand-navy/10 pt-8 text-base text-brand-slate">
                <p>Preferisci parlarne subito?</p>
                {CONFIG.phone && (
                  <a href={`tel:${CONFIG.phone.replace(/\s/g, '')}`} className={`flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-blue ${FOCUS_RING} rounded`}>
                    <Phone size={20} strokeWidth={1.5} aria-hidden="true" /> {CONFIG.phone}
                  </a>
                )}
                {CONFIG.email && (
                  <a href={`mailto:${CONFIG.email}`} className={`flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-blue ${FOCUS_RING} rounded`}>
                    <Mail size={20} strokeWidth={1.5} aria-hidden="true" /> {CONFIG.email}
                  </a>
                )}
              </Reveal>
            )}
          </div>

          <Reveal delay={1} className="lg:col-span-7">
            <div className="rounded-2xl border border-brand-navy/10 bg-brand-mist p-6 shadow-[0_30px_80px_-20px_rgba(0,30,80,0.35)] sm:p-10">
              {status === 'success' ? (
                <div ref={statusRef} tabIndex={-1} role="status" className="py-10 focus:outline-none">
                  <CheckCircle2 size={28} strokeWidth={1.5} className="text-brand-blue" aria-hidden="true" />
                  <h3 className="mt-5 text-3xl font-bold tracking-tight text-brand-navy">
                    Grazie{submittedName ? `, ${submittedName}` : ''}.
                  </h3>
                  {CONFIG.formEndpoint ? (
                    <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-brand-slate lg:text-lg">
                      La richiesta è arrivata al nostro team flotte. Ti ricontattiamo entro {CONFIG.responseTime} al numero o
                      all’email che ci hai lasciato.
                    </p>
                  ) : (
                    <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-brand-slate lg:text-lg">
                      Questa è un’anteprima del sito: il modulo non è ancora collegato, quindi la tua richiesta non è stata
                      inviata a nessuno.{' '}
                      {CONFIG.phone ? `Per parlarne subito chiama il ${CONFIG.phone}.` : 'Per parlarne subito passa in una delle due sedi.'}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className={`mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brand-navy/20 px-6 text-sm font-semibold text-brand-navy transition hover:border-brand-navy ${FOCUS_RING}`}
                  >
                    Invia un’altra richiesta
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-6 sm:grid-cols-2">
                  {vehicle && (
                    <div className="sm:col-span-2">
                      <p className={`${EYEBROW} text-brand-navy/70`}>Veicolo scelto</p>
                      <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-brand-blue/30 bg-white py-1.5 pl-4 pr-1.5 text-sm font-semibold text-brand-navy shadow-[0_10px_30px_-12px_rgba(0,30,80,0.35)]">
                        <Car size={16} strokeWidth={1.5} className="shrink-0 text-brand-blue" aria-hidden="true" />
                        <span className="truncate">{vehicle.label}</span>
                        <button
                          type="button"
                          onClick={clearVehicle}
                          aria-label={`Rimuovi ${vehicle.label} dalla richiesta`}
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-navy/70 transition-colors hover:bg-brand-ice hover:text-brand-navy ${FOCUS_RING}`}
                        >
                          <X size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                  <Field id="f-name" label="Nome e cognome" error={errors.name}>
                    <input type="text" autoComplete="name" value={values.name} onChange={set('name')} className={inputCls('name')} {...aria('name')} />
                  </Field>
                  <Field id="f-company" label="Azienda" error={errors.company}>
                    <input type="text" autoComplete="organization" value={values.company} onChange={set('company')} className={inputCls('company')} {...aria('company')} />
                  </Field>
                  <Field id="f-email" label="Email aziendale" error={errors.email}>
                    <input type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set('email')} className={inputCls('email')} {...aria('email')} />
                  </Field>
                  <Field id="f-phone" label="Telefono" error={errors.phone}>
                    <input type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={set('phone')} className={inputCls('phone')} {...aria('phone')} />
                  </Field>
                  <Field id="f-vehicles" label="Numero di veicoli" error={errors.vehicles}>
                    <select value={values.vehicles} onChange={set('vehicles')} className={`${inputCls('vehicles')} appearance-none pr-10`} {...aria('vehicles')}>
                      <option value="">Seleziona</option>
                      {VEHICLE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/60" aria-hidden="true" />
                  </Field>
                  <Field id="f-interest" label="Ti interessa" error={errors.interest}>
                    <select value={values.interest} onChange={set('interest')} className={`${inputCls('interest')} appearance-none pr-10`} {...aria('interest')}>
                      <option value="">Seleziona</option>
                      {INTEREST_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/60" aria-hidden="true" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="f-message" label="Messaggio" optional>
                      <textarea
                        rows={4}
                        value={values.message}
                        onChange={set('message')}
                        placeholder="Che veicoli usate oggi, per che tipo di lavoro, entro quando vi servono."
                        className={`${inputCls('message')} resize-y`}
                        name="message"
                        id="f-message"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={values.privacy}
                        onChange={set('privacy')}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-brand-navy/30 accent-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                        {...aria('privacy')}
                      />
                      <label htmlFor="f-privacy" className="text-sm leading-relaxed text-brand-slate">
                        Ho letto l’
                        <a href={CONFIG.privacyUrl} target="_blank" rel="noopener noreferrer" className={`font-semibold text-brand-blue underline underline-offset-2 hover:text-brand-navy ${FOCUS_RING} rounded`}>
                          informativa privacy
                        </a>{' '}
                        e acconsento al trattamento dei miei dati per ricevere la proposta.
                      </label>
                    </div>
                    {errors.privacy && (
                      <p id="f-privacy-error" className="mt-2 flex items-start gap-1.5 text-sm text-[#B42318]">
                        <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {errors.privacy}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <button type="submit" disabled={status === 'sending'} className={`${BTN_PRIMARY} disabled:cursor-wait disabled:opacity-80`}>
                      {status === 'sending' ? (
                        <>
                          <Loader2 size={20} strokeWidth={1.5} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Invio in corso
                        </>
                      ) : (
                        <>
                          Richiedi una proposta flotta <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
                        </>
                      )}
                    </button>
                    <p className="text-sm text-brand-slate/90">Tutti i campi sono obbligatori, tranne il messaggio.</p>
                  </div>

                  {status === 'error' && (
                    <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318]/30 bg-white p-4 text-sm text-[#B42318] focus:outline-none sm:col-span-2">
                      <AlertCircle size={20} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                      <span>
                        La richiesta non è partita per un problema di connessione. I dati sono ancora qui: riprova tra qualche istante
                        {CONFIG.phone ? ` oppure chiama il ${CONFIG.phone}` : ''}.
                      </span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  const socials = [
    { key: 'instagram', icon: Instagram, label: 'Instagram' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { key: 'facebook', icon: Facebook, label: 'Facebook' },
  ].filter((s) => CONFIG.social[s.key]);
  const linkCls = `rounded text-white/80 transition-colors hover:text-white ${FOCUS_RING} focus-visible:ring-offset-brand-navy`;

  return (
    <footer className="bg-brand-navy text-white">
      <div className={`${CONTAINER} pt-20`}>
        <SignatureLine />
        <div className="mt-14 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <img src={ASSETS.logo} alt="Rubeca Motori Concessionaria Volkswagen" width="300" height="49" loading="lazy" className="h-9 w-auto brightness-0 invert" />
            <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-white/75">The Future is Now.</p>
          </div>
          <div className="md:col-span-5">
            <p className={`${EYEBROW} text-white/70`}>Sedi</p>
            <ul className="mt-5 grid gap-6 sm:grid-cols-2">
              {CONFIG.locations.map((loc) => (
                <li key={loc.city}>
                  <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-start gap-2`}>
                    <MapPin size={20} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-white">
                        {loc.city} ({loc.province})
                      </span>
                      {loc.address && <span className="block text-sm">{loc.address}</span>}
                      <span className="sr-only">, apri in Google Maps in una nuova scheda</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className={`${EYEBROW} text-white/70`}>Contatti</p>
            <ul className="mt-5 space-y-3 text-sm">
              {CONFIG.phone && (
                <li>
                  <a href={`tel:${CONFIG.phone.replace(/\s/g, '')}`} className={`${linkCls} inline-flex items-center gap-2`}>
                    <Phone size={20} strokeWidth={1.5} aria-hidden="true" /> {CONFIG.phone}
                  </a>
                </li>
              )}
              {CONFIG.email && (
                <li>
                  <a href={`mailto:${CONFIG.email}`} className={`${linkCls} inline-flex items-center gap-2`}>
                    <Mail size={20} strokeWidth={1.5} aria-hidden="true" /> {CONFIG.email}
                  </a>
                </li>
              )}
              <li>
                <a href="#contatti" className={`${linkCls} inline-flex items-center gap-2 font-semibold text-white`}>
                  Richiedi una proposta flotta <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
                </a>
              </li>
            </ul>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label="Social">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.key}>
                      <a
                        href={CONFIG.social[s.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.label}, si apre in una nuova scheda`}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/85 transition hover:border-white/40 hover:text-white ${FOCUS_RING} focus-visible:ring-offset-brand-navy`}
                      >
                        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 py-8 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {CONFIG.companyName} · P.IVA {CONFIG.vat}
          </p>
          <ul className="flex gap-6">
            <li>
              <a href={CONFIG.privacyUrl} className={linkCls}>
                Privacy
              </a>
            </li>
            <li>
              <a href={CONFIG.cookieUrl} className={linkCls}>
                Cookie
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Pagina                                                             */
/* ------------------------------------------------------------------ */
export default function RubecaHomepage() {
  const [prefill, setPrefill] = useState(null);

  /* Dalla card flotte al form: preseleziona l'interesse e porta il visitatore al modulo */
  /* Anche dalle card veicolo: l'eventuale veicolo viaggia con il prefill.
     Il focus sul primo campo vuoto lo gestisce ContactSection. */
  const requestProposal = useCallback((interest, vehicle = null) => {
    setPrefill({ interest, vehicle, at: Date.now() });
    scrollToId('contatti');
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-mist font-sans text-brand-slate antialiased selection:bg-brand-blue selection:text-white">
      <a
        href="#main"
        className="sr-only rounded-full bg-brand-blue px-5 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Vai al contenuto
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <ServicesSection onRequest={requestProposal} />
        <VehiclesSection onRequest={requestProposal} />
        <TrustSection />
        <ContactSection prefill={prefill} />
      </main>
      <Footer />
    </div>
  );
}
