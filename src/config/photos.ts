import type { Saison } from '@lib/accueil';

/**
 * Photos de gens à vélo en Auvergne (ADR 0046) : une seule définition, réutilisée par les
 * pages. Seules des photos sous licence libre ou dans le domaine public, ou fournies avec
 * l'accord écrit de leur auteur et des personnes reconnaissables (dont celles de l'éditeur),
 * figurent ici ; chacune garde son auteur, sa licence et sa source, affichés sous l'image.
 *
 * Fichiers : `public/photos/<id>-1200.webp` et `<id>-640.webp`, recadrés et réduits.
 */
export interface Photo {
  /** Identifiant, préfixe des fichiers dans `public/photos/`. */
  id: string;
  /** Texte alternatif : ce que montre la photo. */
  alt: string;
  /** Légende courte, affichée sous la photo. */
  legende: string;
  auteur: string;
  licence: string;
  /** Lien vers le texte de la licence ; absent pour le domaine public ou une photo réservée. */
  licenceUrl?: string;
  /** Nom du site d'origine, affiché dans le crédit ; absent pour une photo de l'éditeur. */
  source?: string;
  /** Page d'origine de la photo ; absente pour une photo de l'éditeur. */
  sourceUrl?: string;
  /** Dimensions du fichier de 1200 pixels de large, pour réserver la place. */
  largeur: number;
  hauteur: number;
}

/** Crédit des photos prises par l'éditeur du site lors de ses sorties. */
const EDITEUR = {
  auteur: 'Pédaler en Auvergne',
  licence: 'tous droits réservés',
  largeur: 1200,
  hauteur: 900,
} as const;

export const PHOTOS = {
  famille: {
    id: 'famille-voie-verte',
    alt: 'Une file d’enfants à vélo, en gilet jaune, roule sur la Via Allier, une voie verte goudronnée le long d’une voie ferrée, sous un ciel de printemps.',
    legende: 'Sortie en famille sur la Via Allier',
    ...EDITEUR,
  },
  gravel: {
    id: 'sortie-gravel-puy-de-dome',
    alt: 'Des cyclistes en tenue font une pause sur un chemin de terre, le puy de Dôme à l’horizon.',
    legende: 'Pause pendant une sortie gravel, face au puy de Dôme',
    ...EDITEUR,
  },
  sourire: {
    id: 'cycliste-sourire',
    alt: 'Un cycliste casqué, sur un vélo chargé de sacoches, sourit en roulant sur une petite route bordée de prés.',
    legende: 'Sur les petites routes, sacoches chargées',
    ...EDITEUR,
  },
  chaineDesPuys: {
    id: 'voie-verte-chaine-des-puys',
    alt: 'Un vélo équipé de sacoches appuyé contre une barrière en bois, au bord d’une voie verte qui file vers la chaîne des Puys.',
    legende: 'La chaîne des Puys au bout de la voie verte',
    ...EDITEUR,
  },
  aiglons: {
    id: 'aiglons-1925-clermont-ambert',
    alt: 'Photo ancienne en noir et blanc : un groupe de coureurs gravit une route de terre bordée de haies, entre Clermont et Ambert.',
    legende: 'Le critérium des Aiglons entre Clermont et Ambert, le 16 août 1925',
    auteur: 'Agence Rol (Gallica, BnF)',
    licence: 'Domaine public',
    source: 'Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:16-8-25,_crit%C3%A9rium_des_Aiglons_(les_cyclistes)_entre_Clermont_et_Ambert_-_btv1b531526487.jpg',
    largeur: 1200,
    hauteur: 813,
  },
} as const satisfies Record<string, Photo>;

/** Une photo par saison, pour l'encart de saison de l'accueil. */
export const PHOTOS_SAISON = {
  hiver: {
    id: 'saison-hiver',
    alt: 'Un vélo de route posé dans la neige, devant une clôture et un puy enneigé.',
    legende: 'Une sortie d’hiver, au pied d’un puy enneigé',
    ...EDITEUR,
  },
  printemps: {
    id: 'saison-printemps',
    alt: 'Un vélo de route appuyé contre une borne, sous un arbre en fleurs blanches, au bord d’un ruisseau.',
    legende: 'Les premiers arbres en fleurs',
    ...EDITEUR,
  },
  ete: {
    id: 'saison-ete',
    alt: 'Un lac bordé de sapins, vu depuis le guidon d’un vélo arrêté sur un sentier.',
    legende: 'Halte au bord d’un lac',
    ...EDITEUR,
  },
  automne: {
    id: 'saison-automne',
    alt: 'Un vélo de route posé au bord d’une route forestière des monts du Forez, dans le brouillard, entre les sapins.',
    legende: 'Brouillard d’automne dans les monts du Forez',
    ...EDITEUR,
  },
} as const satisfies Record<Saison, Photo>;
