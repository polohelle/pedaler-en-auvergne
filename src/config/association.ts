import type { College } from './acteurs';
import { LIBELLES_COLLEGE } from './acteurs';

/**
 * Informations légales de l'association. Les champs `null` sont à renseigner avant la mise
 * en ligne publique (voir docs/runbooks/mettre-en-ligne.md) ; les pages affichent alors
 * une mention neutre plutôt qu'une valeur inventée.
 */
export const ASSOCIATION = {
  nom: 'Pédaler en Auvergne',
  forme: 'Association loi 1901',
  /** Numéro RNA et siège : après la déclaration de l'association. */
  rna: null as string | null,
  adresse: null as string | null,
  directeurPublication: null as string | null,
  /**
   * Adresse de contact publique, y compris pour l'exercice des droits RGPD :
   * `contact@pedalerenauvergne.fr`, à renseigner avant la mise en ligne publique.
   */
  email: null as string | null,
  /**
   * Date (AAAA-MM-JJ) de l'assemblée constitutive qui adopte statuts et charte. Tant qu'elle
   * vaut `null`, les pages de l'association présentent ces textes comme un projet (ADR 0024).
   */
  statutsAdoptesLe: null as string | null,
  /**
   * Pages HelloAsso de l'association (ADR 0024) : `https://www.helloasso.com/associations/…`.
   * `null` tant que la campagne n'existe pas ; la page Adhérer affiche alors une mention neutre.
   */
  helloasso: {
    adhesion: null as string | null,
    don: null as string | null,
  },
} as const;

export const HEBERGEUR = {
  nom: 'Cloudflare, Inc.',
  adresse: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  site: 'https://www.cloudflare.com',
} as const;

/**
 * Collèges de l'association, dans l'ordre des statuts. Les structures de l'annuaire
 * appartiennent aux collèges de `COLLEGES` (src/config/acteurs.ts) ; le collège Cyclistes
 * réunit des particuliers, qui n'ont pas de fiche dans l'annuaire (ADR 0024).
 */
export const COLLEGES_ASSOCIATION = [
  'commerce-reparation',
  'entreprises-a-velo',
  'usagers',
  'sport-loisir',
  'cyclistes',
  'partenaires',
] as const satisfies readonly (College | 'cyclistes')[];
export type CollegeAssociation = (typeof COLLEGES_ASSOCIATION)[number];

export const DETAILS_COLLEGE = {
  'commerce-reparation': {
    libelle: LIBELLES_COLLEGE['commerce-reparation'],
    composition: 'Magasins, réparateurs, loueurs.',
    voix: 'deliberative',
  },
  'entreprises-a-velo': {
    libelle: LIBELLES_COLLEGE['entreprises-a-velo'],
    composition: 'Livraison, cyclologistique, artisans, tourisme à vélo.',
    voix: 'deliberative',
  },
  usagers: {
    libelle: LIBELLES_COLLEGE.usagers,
    composition: "Associations d'usagers, ateliers participatifs, vélo-écoles.",
    voix: 'deliberative',
  },
  'sport-loisir': {
    libelle: LIBELLES_COLLEGE['sport-loisir'],
    composition: 'Clubs, comités, cyclotourisme, VTT.',
    voix: 'deliberative',
  },
  cyclistes: {
    libelle: 'Cyclistes',
    composition: 'Particuliers qui pratiquent le vélo ou veulent le développer.',
    voix: 'deliberative',
  },
  partenaires: {
    libelle: LIBELLES_COLLEGE.partenaires,
    composition: 'Collectivités, écoles, experts, partenaires économiques.',
    voix: 'consultative',
  },
} as const satisfies Record<
  CollegeAssociation,
  { libelle: string; composition: string; voix: 'deliberative' | 'consultative' }
>;

export const LIBELLES_VOIX = {
  deliberative: 'Délibérative',
  consultative: 'Consultative',
} as const;

/**
 * Barème de cotisation annuelle proposé au vote de la première assemblée générale
 * (statuts, article 10) ; montants en euros.
 */
export const BAREME_COTISATION = [
  { profil: 'Particulier', montant: 10 },
  { profil: 'Association ou club bénévole', montant: 20 },
  { profil: 'Entrepreneur individuel', montant: 30 },
  { profil: 'Entreprise de 2 à 10 salariés', montant: 60 },
  { profil: 'Entreprise de plus de 10 salariés', montant: 120 },
  { profil: 'Collectivité', montant: 100 },
] as const;

/** Pages de la partie association, dans l'ordre du menu secondaire. */
export const PAGES_ASSOCIATION = [
  { href: '/association/', libelle: 'Présentation' },
  { href: '/association/charte/', libelle: 'Charte' },
  { href: '/association/gouvernance/', libelle: 'Gouvernance' },
  { href: '/association/membres/', libelle: 'Membres' },
  { href: '/association/adherer/', libelle: 'Adhérer et soutenir' },
  { href: '/association/contact/', libelle: 'Contact' },
] as const;
