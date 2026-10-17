import { z } from 'astro/zod';
import { ORIGINES_EVENEMENT, PRATIQUES_EVENEMENT, TYPES_EVENEMENT } from '@config/evenements';
import { STATUTS_EVENEMENT } from '@config/statuts';
import { estEnAuvergne } from '@lib/geo';
import {
  schemaDateHeure,
  schemaDepartement,
  schemaImage,
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
    /** Route, gravel, VTT ou cyclo-cross ; plusieurs quand l'événement propose plusieurs parcours. */
    pratiques: z.array(z.enum(PRATIQUES_EVENEMENT)).nonempty().optional(),
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
    /** Photo ou affiche avec droits ; à défaut, l'illustration du type est affichée (ADR 0034). */
    image: schemaImage.optional(),
    inscription_url: schemaUrl.optional(),
    source_url: schemaUrl,
    source: z.enum(ORIGINES_EVENEMENT),
    statut: z.enum(STATUTS_EVENEMENT),
  })
  .superRefine((evenement, ctx) => {
    if (evenement.pratiques && new Set(evenement.pratiques).size !== evenement.pratiques.length) {
      ctx.addIssue({ code: 'custom', path: ['pratiques'], message: 'Pratique en double.' });
    }
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
