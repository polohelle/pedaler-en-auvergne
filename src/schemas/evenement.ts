import { z } from 'astro/zod';
import { ORIGINES_EVENEMENT, TYPES_EVENEMENT } from '@config/evenements';
import { STATUTS_EVENEMENT } from '@config/statuts';
import { estEnAuvergne } from '@lib/geo';
import {
  schemaDateHeure,
  schemaDepartement,
  schemaLatitude,
  schemaLongitude,
  schemaSlug,
  schemaTexte,
  schemaUrl,
} from './communs';

export const schemaEvenement = z
  .strictObject({
    titre: schemaTexte,
    type: z.enum(TYPES_EVENEMENT),
    debut: schemaDateHeure,
    fin: schemaDateHeure.optional(),
    lieu: schemaTexte,
    commune: schemaTexte,
    departement: schemaDepartement,
    lat: schemaLatitude.optional(),
    lon: schemaLongitude.optional(),
    /** Slug d'un acteur de l'annuaire. */
    organisateur: schemaSlug.optional(),
    tarif: schemaTexte.optional(),
    inscription_url: schemaUrl.optional(),
    source_url: schemaUrl,
    source: z.enum(ORIGINES_EVENEMENT),
    statut: z.enum(STATUTS_EVENEMENT),
  })
  .superRefine((evenement, ctx) => {
    if (evenement.fin !== undefined && evenement.fin < evenement.debut) {
      ctx.addIssue({ code: 'custom', path: ['fin'], message: 'La fin précède le début.' });
    }
    if ((evenement.lat === undefined) !== (evenement.lon === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Latitude et longitude vont ensemble.',
      });
    } else if (
      evenement.lat !== undefined &&
      evenement.lon !== undefined &&
      !estEnAuvergne(evenement.lat, evenement.lon)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Coordonnées hors d’Auvergne : latitude et longitude inversées ?',
      });
    }
  });

export type Evenement = z.output<typeof schemaEvenement>;
export type EvenementSaisi = z.input<typeof schemaEvenement>;
