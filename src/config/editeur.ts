/**
 * Éditeur du site (ADR 0035). Le site est porté par un particulier, à titre non
 * professionnel et bénévole : son identité est communiquée à l'hébergeur et n'est pas
 * publiée, comme la loi pour la confiance dans l'économie numérique (LCEN) le permet.
 */
export const EDITEUR = {
  /**
   * Adresse de contact publique, y compris pour l'exercice des droits RGPD. Elle est
   * redirigée vers la boîte de l'éditeur par Cloudflare Email Routing. `null` affiche une
   * mention neutre plutôt qu'une adresse inventée.
   */
  email: 'contact@pedalerenauvergne.fr' as string | null,
} as const;

export const HEBERGEUR = {
  nom: 'Cloudflare, Inc.',
  adresse: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  site: 'https://www.cloudflare.com',
} as const;
