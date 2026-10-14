import { z } from 'astro/zod';
import { CATEGORIES_ACTEUR, COLLEGES, ORIGINES_ACTEUR, SERVICES } from '@config/acteurs';
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
  commune: schemaTexte.optional(),
  departement: schemaDepartement,
  lat: schemaLatitude,
  lon: schemaLongitude,
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
};

/** Une fiche publiée est complète et a été vérifiée par un humain. */
const acteurPublie = z.strictObject({
  ...champs,
  statut: z.literal('publie'),
  adresse: schemaTexte,
  code_postal: schemaCodePostal,
  commune: schemaTexte,
  verifie_le: schemaJour,
});

/** Un brouillon (import OSM, proposition) ou une fiche archivée peut être incomplet. */
const acteurNonPublie = z.strictObject({
  ...champs,
  statut: z.literal(['brouillon', 'archive']),
});

export const schemaActeur = z
  .discriminatedUnion('statut', [acteurPublie, acteurNonPublie])
  .superRefine((acteur, ctx) => {
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
