/**
 * Formulaires publics (ADR 0018 pour les données personnelles, ADR 0030 pour le
 * fonctionnement). Aucune valeur secrète ici : la clé secrète Turnstile, le jeton GitHub et
 * l'adresse de l'administrateur sont des variables de la fonction Cloudflare Pages.
 */
export const FORMULAIRES = {
  /** Adresse de la fonction qui reçoit le formulaire « Proposer un événement ». */
  actionEvenement: '/api/proposer-evenement',
  pageEvenement: '/agenda/proposer/',
  pageMerci: '/agenda/proposer/merci/',
  pageErreur: '/agenda/proposer/erreur/',
  /** Dépôt où sont créées les issues, et leurs étiquettes (celles du modèle d'issue). */
  depot: { proprietaire: 'polohelle', nom: 'pedaler-en-auvergne' },
  etiquettesEvenement: ['proposition', 'evenement'],
  /** Expéditeur des e-mails de transmission, sur le domaine vérifié dans Cloudflare. */
  expediteur: 'formulaire@pedalerenauvergne.fr',
  /**
   * Clé de site Turnstile, publique par nature. Sans `PUBLIC_TURNSTILE_SITE_KEY` au build,
   * on utilise la clé de test de Cloudflare : le widget s'affiche, mais la vérification
   * échoue avec la vraie clé secrète, donc rien ne passe en production par erreur.
   */
  cleTurnstileTest: '1x00000000000000000000AA',
  urlTurnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  urlVerificationTurnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  longueurs: { titre: 120, texte: 200, description: 2000, descriptionMin: 20 },
} as const;
