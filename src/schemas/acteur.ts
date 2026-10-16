import { z } from 'astro/zod';
import { CATEGORIES_ACTEUR, COLLEGES, ORIGINES_ACTEUR, SERVICES } from '@config/acteurs';
import { departementDuCodePostal, estEnAuvergne } from '@lib/geo';
import {
  sansDoublon,
  schemaCodePostal,
  schemaDepartement,
  schemaJour,
  schemaLatitude,
  schemaLongitude,
  schemaSlug,
  schemaTelephone,
  schemaTexte,
  schemaUrl,
} from './communs';

const champs = {
  nom: schemaTexte,
  slug: schemaSlug,
  categories: z
    .array(z.enum(CATEGORIES_ACTEUR))
    .min(1, 'Au moins une catégorie.')
    .refine(sansDoublon, 'Catégorie en double.'),
  college: z.enum(COLLEGES).optional(),
  membre: z.boolean(),
  adresse: schemaTexte.optional(),
  code_postal: schemaCodePostal.optional(),
  commune: schemaTexte,
  departement: schemaDepartement,
  lat: schemaLatitude.optional(),
  lon: schemaLongitude.optional(),
  services: z.array(z.enum(SERVICES)).refine(sansDoublon, 'Service en double.').optional(),
  horaires: schemaTexte.optional(),
  site: schemaUrl.optional(),
  email: z.email('Adresse e-mail invalide.').optional(),
  telephone: schemaTelephone.optional(),
  reseaux: z.array(schemaUrl).optional(),
  source: z.enum(ORIGINES_ACTEUR),
  osm_id: z
    .string()
    .regex(/^(?:node|way|relation)\/\d+$/, 'Identifiant OSM attendu : node/123, way/123…')
    .optional(),
  verifie_le: schemaJour.optional(),
  /**
   * Structure sans adresse d'accueil publique (atelier mobile, activité à domicile, accueil sur
   * rendez-vous, adresse non confirmée) : publiée avec sa commune, sans adresse ni position
   * (ADR 0025).
   */
  sans_adresse_publique: z.literal(true).optional(),
  /** Zone où une structure sans adresse publique intervient (« Clermont et sa métropole »). */
  zone_intervention: schemaTexte.optional(),
};

/** Champs qu'une fiche publiée doit renseigner, sauf ceux qu'exclut l'absence d'adresse publique. */
const REQUIS_PUBLICATION = ['adresse', 'code_postal', 'lat', 'lon', 'verifie_le'] as const;
/** Champs interdits à une fiche publiée sans adresse publique. */
const INTERDITS_SANS_ADRESSE = ['adresse', 'lat', 'lon'] as const;

/**
 * Champs d'un brouillon importé d'OpenStreetMap (ADR 0019). Le dépôt est public : un tel
 * brouillon ne contient ni adresse, ni coordonnées, ni moyen de contact, qui peuvent être
 * ceux d'un artisan travaillant à domicile. Ils sont complétés à la vérification humaine.
 */
export const CHAMPS_BROUILLON_OSM = [
  'nom',
  'slug',
  'categories',
  'membre',
  'commune',
  'departement',
  'source',
  'osm_id',
  'statut',
] as const;

/**
 * Une fiche publiée est complète et a été vérifiée par un humain ; ses exigences sont vérifiées
 * ensemble ci-dessous, pour que tous les manques soient signalés d'un coup.
 */
const acteurPublie = z.strictObject({
  ...champs,
  statut: z.literal('publie'),
});

/** Un brouillon (import OSM, proposition) ou une fiche archivée peut être incomplet. */
const acteurNonPublie = z.strictObject({
  ...champs,
  membre: z.boolean().default(false),
  statut: z.literal(['brouillon', 'archive']),
});

export const schemaActeur = z
  .discriminatedUnion('statut', [acteurPublie, acteurNonPublie])
  .superRefine((acteur, ctx) => {
    if (acteur.statut === 'publie') {
      const sansAdresse = acteur.sans_adresse_publique === true;
      for (const champ of REQUIS_PUBLICATION) {
        const exclu = sansAdresse && champ !== 'code_postal' && champ !== 'verifie_le';
        if (!exclu && acteur[champ] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [champ],
            message: sansAdresse
              ? 'Champ requis pour une fiche publiée.'
              : 'Champ requis pour une fiche publiée (ou indiquer sans_adresse_publique: true).',
          });
        }
      }
      if (sansAdresse) {
        for (const champ of INTERDITS_SANS_ADRESSE) {
          if (acteur[champ] !== undefined) {
            ctx.addIssue({
              code: 'custom',
              path: [champ],
              message: "Une fiche sans adresse publique n'affiche ni adresse ni position.",
            });
          }
        }
      }
    }
    if ((acteur.lat === undefined) !== (acteur.lon === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Latitude et longitude vont ensemble.',
      });
    } else if (
      acteur.lat !== undefined &&
      acteur.lon !== undefined &&
      !estEnAuvergne(acteur.lat, acteur.lon)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Coordonnées hors d’Auvergne : latitude et longitude inversées ?',
      });
    }
    if (acteur.source === 'osm' && acteur.osm_id === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['osm_id'],
        message: 'Une fiche issue d’OpenStreetMap garde son identifiant OSM.',
      });
    }
    if (acteur.source === 'osm' && acteur.statut === 'brouillon') {
      const autorises = new Set<string>(CHAMPS_BROUILLON_OSM);
      for (const [champ, valeur] of Object.entries(acteur)) {
        if (valeur !== undefined && !autorises.has(champ)) {
          ctx.addIssue({
            code: 'custom',
            path: [champ],
            message:
              'Un brouillon importé d’OpenStreetMap ne contient que les champs minimaux : compléter la fiche lors de sa vérification, au moment de la publier.',
          });
        }
      }
    }
    if (
      acteur.code_postal !== undefined &&
      departementDuCodePostal(acteur.code_postal) !== acteur.departement
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['code_postal'],
        message: `Le code postal ne correspond pas au département ${acteur.departement}.`,
      });
    }
    if (acteur.membre && acteur.college === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['college'],
        message: 'Un membre doit être rattaché à un collège.',
      });
    }
    if (!acteur.membre && acteur.college !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['college'],
        message: 'Le collège ne concerne que les membres.',
      });
    }
  });

export type Acteur = z.output<typeof schemaActeur>;
export type ActeurSaisi = z.input<typeof schemaActeur>;
