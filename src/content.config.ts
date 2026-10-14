import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { schemaActeur } from '@schemas/acteur';
import { schemaActu } from '@schemas/actu';
import { schemaEvenement } from '@schemas/evenement';

// L'identifiant d'un acteur est son champ `slug` ; celui d'un événement ou d'une actu,
// le nom de son fichier (`aaaa-mm-jj-slug`).
const acteurs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/acteurs' }),
  schema: schemaActeur,
});

const evenements = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/evenements' }),
  schema: schemaEvenement,
});

const actus = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/actus' }),
  schema: schemaActu,
});

export const collections = { acteurs, evenements, actus };
