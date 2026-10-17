/**
 * Briques de schéma partagées. Les schémas de `src/schemas/` ne dépendent pas
 * d'`astro:content` : le site, les scripts, les tests et les futures fonctions des
 * formulaires les importent tels quels.
 */
import { z } from 'astro/zod';
import { CODES_DEPARTEMENT } from '@config/departements';

// Messages d'erreur de Zod en français, pour l'administrateur comme pour les formulaires.
z.config(z.locales.fr());

export const schemaTexte = z.string().trim().min(1, 'Champ vide.');

export const schemaSlug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug attendu : minuscules, chiffres et tirets (ex. atelier-velo-clermont).',
  );

export const schemaDepartement = z.enum(CODES_DEPARTEMENT);

export const schemaCodePostal = z.string().regex(/^\d{5}$/, 'Code postal à cinq chiffres attendu.');

export const schemaLatitude = z.number().min(-90).max(90);
export const schemaLongitude = z.number().min(-180).max(180);

export const schemaUrl = z.url({ protocol: /^https?$/, error: 'Adresse web http(s) attendue.' });

export const schemaTelephone = z
  .string()
  .regex(/^(?:\+33 ?|0)[1-9](?:[ .-]?\d{2}){4}$/, 'Numéro de téléphone français attendu.');

/**
 * Jour civil `AAAA-MM-JJ`. YAML convertit un jour écrit sans guillemets en `Date` à minuit UTC :
 * on l'accepte et on le ramène à sa chaîne.
 */
export const schemaJour = z.union([
  z.iso.date({ error: 'Jour attendu au format AAAA-MM-JJ.' }),
  z.date().transform((date) => date.toISOString().slice(0, 10)),
]);

/**
 * Date-heure ISO 8601 avec fuseau, convertie en `Date`. Elle doit être entre guillemets :
 * sans guillemets, YAML la convertit lui-même et un oubli de fuseau passerait inaperçu.
 */
export const schemaDateHeure = z.iso
  .datetime({
    offset: true,
    error: 'Date-heure attendue entre guillemets, avec fuseau : "2026-11-08T09:30:00+01:00".',
  })
  .transform((texte) => new Date(texte));

export function sansDoublon(valeurs: readonly unknown[]): boolean {
  return new Set(valeurs).size === valeurs.length;
}

/**
 * Image d'une actualité ou d'un événement, servie par le site (CSP `img-src 'self'`) : libre de
 * droits ou fournie avec autorisation, texte alternatif et crédit obligatoires.
 */
export const schemaImage = z.strictObject({
  src: schemaTexte,
  alt: schemaTexte,
  credit: schemaTexte,
});
