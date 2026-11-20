/**
 * Éléments vivants de la page d'accueil (ADR 0045) : chiffres réels de l'annuaire et de
 * l'agenda, et mot de saison. Tout est calculé depuis les contenus publiés et la date de
 * construction, jamais écrit en dur.
 */
import { jourCivil } from './dates';

/** Un chiffre clé : la valeur et son libellé accordé. */
export interface ChiffreCle {
  valeur: number;
  libelle: string;
}

/** Nombres bruts à mettre en avant, comptés sur les contenus publiés. */
export interface Comptes {
  acteurs: number;
  communes: number;
  rendezVous: number;
  parcours: number;
}

function accorder(n: number, singulier: string, pluriel: string): string {
  return n > 1 ? pluriel : singulier;
}

/**
 * Chiffres clés de l'accueil, dans l'ordre d'affichage ; un compte nul est omis, pour ne
 * jamais afficher « 0 parcours ».
 */
export function chiffresCles(comptes: Comptes): ChiffreCle[] {
  const chiffres: ChiffreCle[] = [
    {
      valeur: comptes.acteurs,
      libelle: accorder(comptes.acteurs, 'acteur du vélo', 'acteurs du vélo'),
    },
    { valeur: comptes.communes, libelle: accorder(comptes.communes, 'commune', 'communes') },
    // « Rendez-vous » et « parcours » sont invariables.
    { valeur: comptes.rendezVous, libelle: 'rendez-vous à venir' },
    { valeur: comptes.parcours, libelle: 'parcours à télécharger' },
  ];
  return chiffres.filter(({ valeur }) => valeur > 0);
}

export type Saison = 'hiver' | 'printemps' | 'ete' | 'automne';

/** Mot de saison : un titre court et une phrase utile, sans date ni promesse. */
export interface MotDeSaison {
  saison: Saison;
  titre: string;
  texte: string;
}

const MOTS: Record<Saison, Omit<MotDeSaison, 'saison'>> = {
  hiver: {
    titre: "L'hiver à vélo",
    texte:
      "C'est la saison des bourses, des ateliers de réparation et du cyclo-cross. Les jours sont courts : lumières allumées et couches chaudes.",
  },
  printemps: {
    titre: 'Le printemps à vélo',
    texte:
      'Les clubs reprennent leurs sorties, les cols se dégagent peu à peu et Mai à vélo se prépare. Une révision avant de ressortir ?',
  },
  ete: {
    titre: "L'été à vélo",
    texte:
      "Longues journées, randonnées de clubs et voies vertes : partez tôt, emportez de l'eau et gardez un œil sur l'orage.",
  },
  automne: {
    titre: "L'automne à vélo",
    texte:
      'Gravel dans les feuilles, bourses aux vélos et premiers cyclo-cross. Les jours raccourcissent : pensez à vos lumières.',
  },
};

/** Saison d'un mois (1 à 12), découpée par trimestres météorologiques. */
export function saisonDuMois(mois: number): Saison {
  if (mois === 12 || mois <= 2) return 'hiver';
  if (mois <= 5) return 'printemps';
  if (mois <= 8) return 'ete';
  return 'automne';
}

/** Mot de saison d'une date, selon le mois à Paris. */
export function motDeSaison(date: Date): MotDeSaison {
  const saison = saisonDuMois(Number(jourCivil(date).slice(5, 7)));
  return { saison, ...MOTS[saison] };
}
