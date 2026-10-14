/** Carnet des sources de veille (data/sources.yaml), lu par les agents de veille et de collecte. */
import { z } from 'astro/zod';
import { FIABILITES, FREQUENCES, NIVEAUX_SOURCE, TYPES_SOURCE } from '@config/sources';
import {
  sansDoublon,
  schemaDepartement,
  schemaJour,
  schemaSlug,
  schemaTexte,
  schemaUrl,
} from './communs';

export const schemaSource = z
  .strictObject({
    nom: schemaTexte,
    url: schemaUrl,
    type: z.enum(TYPES_SOURCE),
    niveau: z.enum(NIVEAUX_SOURCE),
    /** Département couvert ; `null` pour une source régionale ou nationale. */
    departement: schemaDepartement.nullable(),
    /** Slug de l'acteur de l'annuaire qui publie la source, s'il y en a un. */
    acteur: schemaSlug.nullable(),
    fiabilite: z.enum(FIABILITES),
    frequence: z.enum(FREQUENCES),
    /** Dernier passage d'un agent ; `null` tant qu'aucun n'est passé. */
    dernier_passage: schemaJour.nullable(),
    /** Usage, limites, conditions de reprise, motif d'une fiabilité faible. */
    notes: schemaTexte.optional(),
  })
  .superRefine((source, ctx) => {
    if (source.niveau === 'local' && source.departement === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['departement'],
        message: 'Une source locale est rattachée à un département.',
      });
    }
    if (source.niveau === 'national' && source.departement !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['departement'],
        message: 'Une source nationale ne relève d’aucun département.',
      });
    }
  });

export const schemaCarnetSources = z
  .strictObject({ sources: z.array(schemaSource).min(1) })
  .superRefine(({ sources }, ctx) => {
    if (!sansDoublon(sources.map((source) => source.url))) {
      ctx.addIssue({ code: 'custom', path: ['sources'], message: 'Adresse de source en double.' });
    }
    if (!sansDoublon(sources.map((source) => source.nom))) {
      ctx.addIssue({ code: 'custom', path: ['sources'], message: 'Nom de source en double.' });
    }
  });

export type Source = z.output<typeof schemaSource>;
