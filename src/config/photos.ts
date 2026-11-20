/**
 * Photos de gens à vélo en Auvergne (ADR 0046) : une seule définition, réutilisée par les
 * pages. Seules des photos sous licence libre ou dans le domaine public, ou fournies avec
 * l'accord écrit de leur auteur et des personnes reconnaissables, figurent ici ; chacune
 * garde son auteur, sa licence et sa source, affichés sous l'image.
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
  /** Lien vers le texte de la licence ; absent pour le domaine public. */
  licenceUrl?: string;
  /** Nom du site d'origine, affiché dans le crédit (« Wikimedia Commons », « l'auteur »…). */
  source: string;
  /** Page d'origine de la photo. */
  sourceUrl: string;
  /** Dimensions du fichier de 1200 pixels de large, pour réserver la place. */
  largeur: number;
  hauteur: number;
}

const CC_BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr';

export const PHOTOS = {
  tramway: {
    id: 'c-velo-tramway-clermont',
    alt: 'Un cycliste casqué sur un vélo C.Vélo longe le tramway rouge, dans le centre de Clermont-Ferrand.',
    legende: 'À vélo le long du tram, à Clermont-Ferrand',
    auteur: 'Sebbi Marrec',
    licence: 'CC BY-SA 4.0',
    licenceUrl: CC_BY_SA_4,
    source: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:C.V%C3%A9lo_et_tramway_-_Clermont.JPG',
    largeur: 1200,
    hauteur: 800,
  },
  clermont: {
    id: 'cycliste-clermont',
    alt: 'Un cycliste en chemise traverse une place de Clermont-Ferrand devant une église en pierre de Volvic et un massif de fleurs rouges.',
    legende: 'Un trajet du quotidien, place Delille à Clermont-Ferrand',
    auteur: 'Jean-Louis Zimmermann',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/deed.fr',
    source: 'Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Cycliste_(CLERMONT-FERRAND,FR63)_(4847204105).jpg',
    largeur: 1200,
    hauteur: 900,
  },
  velodrome: {
    id: 'velodrome-lurcy-levis',
    alt: 'Des coureurs et leurs proches sur la piste et la pelouse du vélodrome de Lurcy-Lévis, un jour de course.',
    legende: 'Jour de course au vélodrome de Lurcy-Lévis, dans l’Allier',
    auteur: 'Lurcy',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.fr',
    source: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lurcy-velo-3.JPG',
    largeur: 1200,
    hauteur: 898,
  },
  velay: {
    id: 'saint-pal-de-mons-velo',
    alt: 'Un vélo chargé de sacoches, posé au bord d’une petite route de campagne vallonnée, près de Saint-Pal-de-Mons.',
    legende: 'Pause au bord de la route, à Saint-Pal-de-Mons en Haute-Loire',
    auteur: 'Havang(nl)',
    licence: 'CC0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.fr',
    source: 'Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:DSC02374_St.Pal-de-Mons_(Haute-Loire,_Fr)_paysage_avec_v%C3%A9lo.JPG',
    largeur: 1200,
    hauteur: 900,
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
