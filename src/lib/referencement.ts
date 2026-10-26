/**
 * Référencement : pages proposées aux moteurs de recherche et plan du site (sitemap.xml).
 * Une page non indexable porte `noindex` et n'entre pas dans le plan du site.
 */
import { echapperXml } from './rss';

/**
 * Pages sans intérêt hors du parcours d'un visiteur : retour d'un formulaire, page de secours
 * hors connexion, espace organisateur personnel (ADR 0038).
 */
const PREFIXES_NON_INDEXABLES = [
  '/organisateur/',
  '/hors-ligne/',
  '/agenda/proposer/merci/',
  '/agenda/proposer/erreur/',
] as const;

/**
 * La page 404, servie avec le statut HTTP 404, n'est jamais indexée : elle sort du plan du site
 * sans porter `noindex`, que Lighthouse compterait comme une faute sur sa copie `404.html`.
 */
const estPage404 = (chemin: string) => chemin.startsWith('/404');

/** La page de ce chemin (`/agenda/`, `/hors-ligne/`…) doit-elle être indexée ? */
export function estIndexable(chemin: string): boolean {
  return !PREFIXES_NON_INDEXABLES.some((prefixe) => chemin.startsWith(prefixe));
}

/** Adresse absolue d'un chemin du site (image, page) ; une adresse déjà absolue est gardée. */
export function urlAbsolue(chemin: string, site: string | URL): string {
  return new URL(chemin, site).href;
}

/**
 * Plan du site au format sitemaps.org, trié et sans doublon, à partir des chemins des pages
 * construites (`''`, `agenda/`, `annuaire/velo-riom/`…).
 */
export function genererPlanDuSite(chemins: readonly string[], site: string | URL): string {
  const adresses = [
    ...new Set(
      chemins
        .map((chemin) => `/${chemin}`.replace(/^\/+/, '/'))
        .filter((chemin) => estIndexable(chemin) && !estPage404(chemin))
        .map((chemin) => urlAbsolue(chemin, site)),
    ),
  ].sort();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...adresses.map((adresse) => `  <url><loc>${echapperXml(adresse)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}
