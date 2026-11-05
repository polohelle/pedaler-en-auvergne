/**
 * Publications Instagram du site (ADR 0042) : choix des contenus de la semaine, légendes et
 * diapositives HTML de 1080 × 1350 px, capturées en images par `scripts/instagram.ts`.
 * Rien n'est publié automatiquement : l'administrateur relit le lot et le programme lui-même.
 */
import { DEPARTEMENTS, type CodeDepartement } from '@config/departements';
import {
  LIBELLES_PRATIQUE_EVENEMENT,
  LIBELLES_TYPE_EVENEMENT,
  type PratiqueEvenement,
  type TypeEvenement,
} from '@config/evenements';
import { SITE } from '@config/site';
import type { StatutEvenement } from '@config/statuts';
import {
  formaterHeure,
  formaterJourMois,
  formaterPlage,
  formaterSemaine,
  jourCivil,
  pastilleDate,
} from './dates';
import { estEvenementVisible } from './publication';

/** Format portrait du fil Instagram. */
export const LARGEUR_DIAPOSITIVE = 1080;
export const HAUTEUR_DIAPOSITIVE = 1350;

/** Un carrousel compte au plus 10 images sur les applications : la couverture et 9 événements. */
export const EVENEMENTS_PAR_CARROUSEL = 9;

export interface EvenementInstagram {
  titre: string;
  type: TypeEvenement;
  pratiques?: readonly PratiqueEvenement[] | undefined;
  debut: Date;
  fin?: Date | undefined;
  lieu: string;
  commune: string;
  departement: CodeDepartement;
  organisateur?: string | undefined;
  tarif?: string | undefined;
  image?: { src: string; alt: string; credit: string } | undefined;
  statut: StatutEvenement;
}

export interface Semaine {
  /** Lundi et dimanche, jours civils `AAAA-MM-JJ` à Paris. */
  lundi: string;
  dimanche: string;
}

const JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Midi UTC d'un jour civil : le même jour à Paris, quelle que soit l'heure d'été. */
function midi(jour: string): Date {
  if (!JOUR.test(jour) || Number.isNaN(Date.parse(`${jour}T12:00:00Z`))) {
    throw new RangeError(`Jour AAAA-MM-JJ attendu : « ${jour} ».`);
  }
  return new Date(`${jour}T12:00:00Z`);
}

function ajouterJours(jour: string, jours: number): string {
  const date = midi(jour);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/** Semaine du lundi au dimanche qui contient le jour donné. */
export function semaineDe(jour: string): Semaine {
  const decalage = (midi(jour).getUTCDay() + 6) % 7;
  const lundi = ajouterJours(jour, -decalage);
  return { lundi, dimanche: ajouterJours(lundi, 6) };
}

/**
 * Semaine à préparer : la semaine en cours du lundi au vendredi, la suivante le week-end,
 * quand on prépare le carrousel du lundi.
 */
export function semaineAPreparer(maintenant: Date): Semaine {
  const jour = jourCivil(maintenant);
  const jourSemaine = midi(jour).getUTCDay();
  return semaineDe(jourSemaine === 0 || jourSemaine === 6 ? ajouterJours(jour, 2) : jour);
}

/** Événements visibles sur le site qui ont lieu, au moins en partie, pendant la semaine. */
export function evenementsDeLaSemaine<T extends EvenementInstagram>(
  evenements: readonly T[],
  semaine: Semaine,
  maintenant: Date,
): T[] {
  return evenements
    .filter(
      (evenement) =>
        estEvenementVisible(evenement, maintenant) &&
        jourCivil(evenement.debut) <= semaine.dimanche &&
        jourCivil(evenement.fin ?? evenement.debut) >= semaine.lundi,
    )
    .toSorted((a, b) => a.debut.getTime() - b.debut.getTime());
}

const CHEMINS_RESERVES = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'tv']);

/** Compte Instagram d'une structure, d'après les liens de sa fiche : « @becycles.clermont ». */
export function compteInstagram(reseaux: readonly string[] | undefined): string | undefined {
  for (const lien of reseaux ?? []) {
    const compte = /^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?(?:[?#].*)?$/.exec(
      lien,
    )?.[1];
    if (compte !== undefined && !CHEMINS_RESERVES.has(compte.toLowerCase())) {
      return `@${compte}`;
    }
  }
  return undefined;
}

const DANS_DEPARTEMENT = {
  '63': 'dans le Puy-de-Dôme',
  '03': "dans l'Allier",
  '15': 'dans le Cantal',
  '43': 'en Haute-Loire',
} as const satisfies Record<CodeDepartement, string>;

/** « dans le Puy-de-Dôme », « dans le Puy-de-Dôme et dans l'Allier », dans l'ordre de la config. */
function lieuDesEvenements(evenements: readonly EvenementInstagram[]): string {
  const codes = new Set(evenements.map((evenement) => evenement.departement));
  const lieux = (Object.keys(DEPARTEMENTS) as CodeDepartement[])
    .filter((code) => codes.has(code))
    .map((code) => DANS_DEPARTEMENT[code]);
  const dernier = lieux.pop() ?? DANS_DEPARTEMENT['63'];
  return lieux.length === 0 ? dernier : `${lieux.join(', ')} et ${dernier}`;
}

/** « sam. 14 nov. » */
function dateCourte(date: Date): string {
  const { jourSemaine, jour, mois } = pastilleDate(date);
  return `${jourSemaine} ${jour} ${mois}`;
}

/** Horaire d'une diapositive : « 10 h 30 – 16 h 30 », ou la plage complète sur plusieurs jours. */
export function horaire(evenement: Pick<EvenementInstagram, 'debut' | 'fin'>): string {
  const { debut, fin } = evenement;
  if (fin === undefined) {
    return formaterHeure(debut);
  }
  if (jourCivil(debut) === jourCivil(fin)) {
    return `${formaterHeure(debut)} – ${formaterHeure(fin)}`;
  }
  return formaterPlage(debut, fin);
}

const HASHTAGS_PRATIQUE = {
  route: '#VeloRoute',
  gravel: '#Gravel',
  vtt: '#VTT',
  'cyclo-cross': '#CycloCross',
} as const satisfies Record<PratiqueEvenement, string>;

/** Hashtags : 3 locaux, puis ceux des pratiques de la semaine, sans doublon. */
function hashtags(evenements: readonly EvenementInstagram[]): string {
  const pratiques = new Set(evenements.flatMap((evenement) => evenement.pratiques ?? []));
  return [
    '#Velo',
    '#PuyDeDome',
    '#Auvergne',
    ...[...pratiques].map((pratique) => HASHTAGS_PRATIQUE[pratique]),
  ].join(' ');
}

/**
 * Légende du carrousel « Cette semaine à vélo » : une ligne par événement, l'organisateur
 * tagué quand sa fiche donne son compte Instagram, puis le renvoi au site et les hashtags.
 * `comptes` associe le slug d'un acteur à son compte (« @… »).
 */
export function legendeSemaine(
  evenements: readonly EvenementInstagram[],
  semaine: Semaine,
  comptes: ReadonlyMap<string, string>,
): string {
  const periode = formaterSemaine(midi(semaine.lundi), midi(semaine.dimanche));
  if (evenements.length === 0) {
    throw new RangeError(`Aucun événement ${periode} : pas de carrousel cette semaine.`);
  }
  const lignes = evenements.map((evenement) => {
    const compte =
      evenement.organisateur === undefined ? undefined : comptes.get(evenement.organisateur);
    const annule = evenement.statut === 'annule' ? 'ANNULÉ · ' : '';
    return `• ${annule}${dateCourte(evenement.debut)} · ${evenement.titre}, ${evenement.commune}${
      compte === undefined ? '' : ` ${compte}`
    }`;
  });
  return [
    `Cette semaine à vélo ${lieuDesEvenements(evenements)}, ${periode} :`,
    '',
    ...lignes,
    '',
    'Horaires, tarifs et inscriptions sur le site : lien en bio.',
    `Un événement à ajouter ? Proposez-le sur ${new URL(SITE.url).host}.`,
    '',
    hashtags(evenements),
  ].join('\n');
}

const ENTITES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function echapperHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (caractere) => ENTITES[caractere] ?? caractere);
}

/** Ressources des diapositives, fournies par le script : polices, logo et images du site. */
export interface Ressources {
  /** URL des fichiers woff2 des deux polices du site. */
  policeTitres: string;
  policeTexte: string;
  /** Balisage SVG du logo (`public/favicon.svg`). */
  logo: string;
  /** URL d'une image du site à partir de son chemin public (« /evenements/….webp »). */
  urlImage: (chemin: string) => string;
}

/** Couleurs des types d'événement (ADR 0039), reprises de `src/styles/tokens.css`. */
const COULEURS_TYPE = {
  sortie: '#2d6a3e',
  randonnee: '#0f6b70',
  'social-ride': '#a3285a',
  course: '#b3261e',
  velorution: '#5b3f9b',
  bourse: '#e8b04a',
  'fete-du-velo': '#1d5e8a',
  'atelier-reparation': '#7a4a26',
  formation: '#475867',
  conference: '#475867',
  'reunion-publique': '#475867',
} as const satisfies Record<TypeEvenement, string>;

function contrasteType(type: TypeEvenement): string {
  return type === 'bourse' ? '#22303a' : '#ffffff';
}

const RELIEF =
  '<svg class="relief" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">' +
  '<path d="M0 24V16c30-4 50-9 80-8s50 8 80 5 50-10 80-9 50 6 80 8v12Z"/></svg>';

function page(ressources: Ressources, classe: string, corps: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
@font-face { font-family: 'Titres'; font-weight: 200 800; src: url('${ressources.policeTitres}') format('woff2-variations'); }
@font-face { font-family: 'Texte'; font-weight: 200 900; src: url('${ressources.policeTexte}') format('woff2-variations'); }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${String(LARGEUR_DIAPOSITIVE)}px; height: ${String(HAUTEUR_DIAPOSITIVE)}px; }
body { position: relative; overflow: hidden; font-family: 'Texte', sans-serif; font-size: 40px; line-height: 1.3; color: #22303a; background: #f4f6f5; }
.diapo { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 80px; }
.marque { display: flex; align-items: center; gap: 24px; font-family: 'Titres', sans-serif; font-weight: 700; font-size: 40px; }
.marque svg { width: 88px; height: 88px; flex: none; }
.titre { font-family: 'Titres', sans-serif; font-weight: 800; line-height: 1.05; letter-spacing: -0.01em; }
.pied { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-weight: 600; font-size: 34px; }
.relief { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 150px; fill: #a9cdb2; }
.couverture { background: #22303a; color: #ffffff; }
.couverture .relief { fill: #2d6a3e; }
.couverture .surtitre { margin-top: 120px; font-size: 44px; font-weight: 600; color: #e8b04a; text-transform: uppercase; letter-spacing: 0.08em; }
.couverture .titre { margin-top: 24px; font-size: 128px; }
.couverture .periode { margin-top: 48px; font-size: 48px; font-weight: 600; }
.couverture .compte { margin-top: 24px; font-size: 44px; color: #d6dee3; }
.couverture .pied { position: relative; z-index: 1; padding-top: 32px; padding-bottom: 130px; }
.evenement .bandeau { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 56px; }
.etiquette { display: inline-block; padding: 10px 26px; border-radius: 12px; font-weight: 700; font-size: 34px; background: #22303a; color: #ffffff; }
.etiquette.annule { background: #a3201a; }
.evenement .date { margin-top: 48px; font-family: 'Titres', sans-serif; font-weight: 800; font-size: 64px; line-height: 1.1; color: #a8401a; }
.evenement .titre { margin-top: 24px; font-size: 68px; }
.evenement .titre.long { font-size: 54px; }
.evenement .titre.barre { text-decoration: line-through; }
.evenement .infos { margin-top: 36px; display: grid; gap: 10px; font-size: 42px; }
.evenement .infos .doux { color: #56626c; }
.evenement .image { margin-top: 40px; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
.evenement .image img { flex: 1 1 0; min-height: 0; width: 100%; object-fit: contain; object-position: left center; border-radius: 16px; }
.evenement .image p { font-size: 26px; color: #56626c; }
.evenement .pied { position: relative; z-index: 1; padding-top: 32px; padding-bottom: 90px; }
</style>
</head>
<body><div class="diapo ${classe}">${corps}</div>${RELIEF}</body>
</html>
`;
}

function marque(ressources: Ressources): string {
  return `<div class="marque">${ressources.logo}<span>${echapperHtml(SITE.nom)}</span></div>`;
}

const SITE_AFFICHE = new URL(SITE.url).host;

/** Diapositive de couverture du carrousel « Cette semaine à vélo ». */
export function diapositiveCouverture(
  evenements: readonly EvenementInstagram[],
  semaine: Semaine,
  ressources: Ressources,
): string {
  const periode = formaterSemaine(midi(semaine.lundi), midi(semaine.dimanche));
  const nombre = evenements.length;
  const enPlus = nombre - EVENEMENTS_PAR_CARROUSEL;
  const compte = `${String(nombre)} rendez-vous ${lieuDesEvenements(evenements)}${
    enPlus > 0 ? `, dont ${String(enPlus)} à retrouver sur le site` : ''
  }`;
  return page(
    ressources,
    'couverture',
    `${marque(ressources)}
<p class="surtitre">L'agenda vélo</p>
<h1 class="titre">Cette semaine à vélo</h1>
<p class="periode">${echapperHtml(periode.charAt(0).toUpperCase() + periode.slice(1))}</p>
<p class="compte">${echapperHtml(compte)}</p>
<div class="pied"><span>${SITE_AFFICHE}</span><span>Faites défiler →</span></div>`,
  );
}

/** Diapositive d'un événement : type, date, titre, lieu, horaire, tarif et affiche créditée. */
export function diapositiveEvenement(
  evenement: EvenementInstagram,
  position: { rang: number; total: number },
  ressources: Ressources,
): string {
  const date = formaterJourMois(evenement.debut);
  const annule = evenement.statut === 'annule';
  const etiquettes = [
    `<span class="etiquette" style="background:${COULEURS_TYPE[evenement.type]};color:${contrasteType(evenement.type)}">${echapperHtml(LIBELLES_TYPE_EVENEMENT[evenement.type])}</span>`,
    ...(evenement.pratiques ?? []).map(
      (pratique) =>
        `<span class="etiquette">${echapperHtml(LIBELLES_PRATIQUE_EVENEMENT[pratique])}</span>`,
    ),
    ...(annule ? ['<span class="etiquette annule">Annulé</span>'] : []),
  ];
  const classesTitre = [
    'titre',
    ...(evenement.titre.length > 55 ? ['long'] : []),
    ...(annule ? ['barre'] : []),
  ].join(' ');
  const image =
    evenement.image === undefined
      ? ''
      : `<div class="image"><img src="${echapperHtml(ressources.urlImage(evenement.image.src))}" alt="${echapperHtml(evenement.image.alt)}"><p>Image : ${echapperHtml(evenement.image.credit)}</p></div>`;
  return page(
    ressources,
    'evenement',
    `${marque(ressources)}
<div class="bandeau">${etiquettes.join('')}</div>
<p class="date">${echapperHtml(date.charAt(0).toUpperCase() + date.slice(1))}</p>
<h1 class="${classesTitre}">${echapperHtml(evenement.titre)}</h1>
<div class="infos">
<p>${echapperHtml(`${evenement.lieu}, ${evenement.commune}`)}</p>
<p class="doux">${echapperHtml(horaire(evenement))}${evenement.tarif === undefined ? '' : ` · ${echapperHtml(evenement.tarif)}`}</p>
</div>
${image}
<div class="pied"><span>Détails sur ${SITE_AFFICHE}</span><span>${String(position.rang)}/${String(position.total)}</span></div>`,
  );
}

/** Carrousel complet : la couverture, puis un événement par diapositive, 9 au plus. */
export function carrouselSemaine(
  evenements: readonly EvenementInstagram[],
  semaine: Semaine,
  ressources: Ressources,
): string[] {
  if (evenements.length === 0) {
    throw new RangeError('Aucun événement cette semaine : pas de carrousel.');
  }
  const retenus = evenements.slice(0, EVENEMENTS_PAR_CARROUSEL);
  const total = retenus.length + 1;
  return [
    diapositiveCouverture(evenements, semaine, ressources),
    ...retenus.map((evenement, index) =>
      diapositiveEvenement(evenement, { rang: index + 2, total }, ressources),
    ),
  ];
}
