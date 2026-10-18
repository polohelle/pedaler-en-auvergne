import { z } from 'astro/zod';
import {
  DIFFICULTES,
  FORMES,
  LICENCES_TRACE,
  ORIGINES_ITINERAIRE,
  PRATIQUES_ITINERAIRE,
} from '@config/itineraires';
import { STATUTS_ITINERAIRE } from '@config/statuts';
import { schemaDepartement, schemaJour, schemaSlug, schemaTexte, schemaUrl } from './communs';

/**
 * Fiche d'un itinéraire (ADR 0035) : `itineraires/<slug>.md`, accompagnée de sa trace
 * `itineraires/<slug>.gpx`. Distance, dénivelé et départ sont lus dans la trace.
 */
export const schemaItineraire = z
  .strictObject({
    titre: schemaTexte,
    pratique: z.enum(PRATIQUES_ITINERAIRE),
    difficulte: z.enum(DIFFICULTES),
    forme: z.enum(FORMES),
    /** Balisé sur le terrain (panneaux, flèches) ; sinon il faut suivre la trace. */
    balise: z.boolean(),
    /** Commune de départ. */
    commune: schemaTexte,
    departement: schemaDepartement,
    /** Point de départ précis : parking, gare, place. */
    depart: schemaTexte.optional(),
    /** Slug de la structure de l'annuaire qui propose le parcours, s'il y en a une. */
    acteur: schemaSlug.optional(),
    /** Auteur ou producteur de la trace, cité avec la licence. */
    auteur: schemaTexte,
    licence: z.enum(LICENCES_TRACE),
    /** Page qui présente le parcours et énonce sa licence. */
    source_url: schemaUrl,
    /** Adresse du fichier de trace d'origine, quand elle diffère de la page source. */
    trace_url: schemaUrl.optional(),
    source: z.enum(ORIGINES_ITINERAIRE),
    /** Dernière vérification de la trace et de sa licence par un humain. */
    verifie_le: schemaJour.optional(),
    statut: z.enum(STATUTS_ITINERAIRE),
  })
  .superRefine((itineraire, ctx) => {
    if (itineraire.statut === 'publie' && itineraire.verifie_le === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['verifie_le'],
        message: 'Un itinéraire publié porte la date de sa dernière vérification.',
      });
    }
  });

export type Itineraire = z.output<typeof schemaItineraire>;
export type ItineraireSaisi = z.input<typeof schemaItineraire>;
