/**
 * Informations légales de l'association. Les champs `null` sont à renseigner avant la mise
 * en ligne publique (voir docs/runbooks/mettre-en-ligne.md) ; les pages affichent alors
 * une mention neutre plutôt qu'une valeur inventée.
 */
export const ASSOCIATION = {
  nom: 'Pédaler en Auvergne',
  forme: 'Association loi 1901',
  /** Numéro RNA et siège : après la déclaration de l'association. */
  rna: null as string | null,
  adresse: null as string | null,
  directeurPublication: null as string | null,
  /**
   * Adresse de contact publique, y compris pour l'exercice des droits RGPD :
   * `contact@pedalerenauvergne.fr`, à renseigner avant la mise en ligne publique.
   */
  email: null as string | null,
} as const;

export const HEBERGEUR = {
  nom: 'Cloudflare, Inc.',
  adresse: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  site: 'https://www.cloudflare.com',
} as const;
