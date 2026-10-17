import { z } from 'astro/zod';
import { CATEGORIES_ACTU, PORTEES, TYPES_ACTU } from '@config/actus';
import { STATUTS_ACTU } from '@config/statuts';
import {
  sansDoublon,
  schemaDepartement,
  schemaImage,
  schemaJour,
  schemaTexte,
  schemaUrl,
} from './communs';

export const schemaActu = z
  .strictObject({
    titre: schemaTexte,
    date: schemaJour,
    type: z.enum(TYPES_ACTU),
    categories: z
      .array(z.enum(CATEGORIES_ACTU))
      .min(1, 'Au moins une catégorie.')
      .refine(sansDoublon, 'Catégorie en double.'),
    resume: schemaTexte.max(400, 'Résumé de 400 caractères au plus.'),
    departement: schemaDepartement.optional(),
    source_url: schemaUrl.optional(),
    source_nom: schemaTexte.optional(),
    image: schemaImage.optional(),
    portee: z.enum(PORTEES),
    statut: z.enum(STATUTS_ACTU),
  })
  .superRefine((actu, ctx) => {
    if (actu.type === 'breve' && actu.source_url === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['source_url'],
        message: 'Une brève renvoie toujours à sa source.',
      });
    }
    if (actu.source_url !== undefined && actu.source_nom === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['source_nom'],
        message: 'Nommer la source citée.',
      });
    }
    if (actu.portee === 'local' && actu.departement === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['departement'],
        message: 'Une actualité locale indique son département.',
      });
    }
  });

export type Actu = z.output<typeof schemaActu>;
export type ActuSaisie = z.input<typeof schemaActu>;
