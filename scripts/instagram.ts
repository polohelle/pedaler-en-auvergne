/**
 * Prépare le carrousel Instagram « Cette semaine à vélo » (ADR 0042), sans rien publier.
 *
 *   pnpm instagram                        semaine en cours (la suivante le week-end)
 *   pnpm instagram --semaine 2026-11-09   semaine qui contient ce jour
 *   pnpm instagram --sortie <dossier>     autre dossier que instagram/<lundi>/
 *
 * Écrit une image PNG carrée de 1080 × 1080 px par diapositive et la légende (`legende.txt`), à
 * relire puis à programmer dans Meta Business Suite. La logique est dans src/lib/instagram.ts ;
 * ce script ne fait que lire les contenus, capturer les diapositives et écrire les fichiers.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { lireMarkdown } from '@lib/frontmatter';
import {
  HAUTEUR_DIAPOSITIVE,
  LARGEUR_DIAPOSITIVE,
  carrouselSemaine,
  compteInstagram,
  evenementsDeLaSemaine,
  legendeSemaine,
  semaineAPreparer,
  semaineDe,
  type Ressources,
} from '@lib/instagram';
import { schemaEvenement, type Evenement } from '@schemas/evenement';

const RACINE = join(import.meta.dirname, '..');
const CONTENUS = join(RACINE, 'src/content');
const POLICES = join(RACINE, 'node_modules/@fontsource-variable');

async function lireDossier(dossier: string): Promise<{ fichier: string; source: string }[]> {
  const fichiers = (await readdir(dossier)).filter((fichier) => fichier.endsWith('.md')).sort();
  return Promise.all(
    fichiers.map(async (fichier) => ({
      fichier,
      source: await readFile(join(dossier, fichier), 'utf8'),
    })),
  );
}

async function lireEvenements(): Promise<Evenement[]> {
  const fichiers = await lireDossier(join(CONTENUS, 'evenements'));
  return fichiers.map(({ fichier, source }) => {
    const resultat = schemaEvenement.safeParse(lireMarkdown(source).donnees);
    if (!resultat.success) {
      throw new Error(`${fichier} : fiche invalide, lancer pnpm test. ${resultat.error.message}`);
    }
    return resultat.data;
  });
}

/** Comptes Instagram des acteurs, d'après le champ `reseaux` de leur fiche. */
async function lireComptes(): Promise<Map<string, string>> {
  const comptes = new Map<string, string>();
  for (const { fichier, source } of await lireDossier(join(CONTENUS, 'acteurs'))) {
    const donnees = lireMarkdown(source).donnees as { reseaux?: unknown };
    const reseaux = Array.isArray(donnees.reseaux)
      ? donnees.reseaux.filter((lien): lien is string => typeof lien === 'string')
      : undefined;
    const compte = compteInstagram(reseaux);
    if (compte !== undefined) {
      comptes.set(fichier.replace(/\.md$/, ''), compte);
    }
  }
  return comptes;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { semaine: { type: 'string' }, sortie: { type: 'string' } },
  });
  const maintenant = new Date();
  const semaine =
    values.semaine === undefined ? semaineAPreparer(maintenant) : semaineDe(values.semaine);
  const evenements = evenementsDeLaSemaine(await lireEvenements(), semaine, maintenant);
  if (evenements.length === 0) {
    console.log(`Aucun événement du ${semaine.lundi} au ${semaine.dimanche} : rien à préparer.`);
    return;
  }

  const ressources: Ressources = {
    policeTitres: pathToFileURL(
      join(POLICES, 'bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'),
    ).href,
    policeTexte: pathToFileURL(
      join(POLICES, 'source-sans-3/files/source-sans-3-latin-wght-normal.woff2'),
    ).href,
    logo: (await readFile(join(RACINE, 'public/favicon.svg'), 'utf8')).replace(
      /<svg /,
      '<svg aria-hidden="true" ',
    ),
    urlImage: (chemin) => pathToFileURL(join(RACINE, 'public', chemin)).href,
  };
  const diapositives = carrouselSemaine(evenements, semaine, ressources);
  const sortie = values.sortie ?? join(RACINE, 'instagram', semaine.lundi);
  await mkdir(sortie, { recursive: true });

  const navigateur = await chromium.launch();
  try {
    const onglet = await navigateur.newPage({
      viewport: { width: LARGEUR_DIAPOSITIVE, height: HAUTEUR_DIAPOSITIVE },
    });
    for (const [index, html] of diapositives.entries()) {
      // Écrite sur disque pour que les polices et images locales (file://) se chargent.
      const fichierHtml = join(sortie, `.${String(index + 1).padStart(2, '0')}.html`);
      await writeFile(fichierHtml, html);
      await onglet.goto(pathToFileURL(fichierHtml).href);
      await onglet.evaluate(() => document.fonts.ready.then(() => undefined));
      await onglet.screenshot({ path: join(sortie, `${String(index + 1).padStart(2, '0')}.png`) });
      await rm(fichierHtml);
    }
  } finally {
    await navigateur.close();
  }
  await writeFile(
    join(sortie, 'legende.txt'),
    `${legendeSemaine(evenements, semaine, await lireComptes())}\n`,
  );
  console.log(
    `${String(diapositives.length)} diapositives et la légende dans ${relative(process.cwd(), sortie) || '.'}/`,
  );
}

await main();
