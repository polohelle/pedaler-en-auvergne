/**
 * Modèles de page contrôlés par les tests bout en bout et d'accessibilité, sur le site
 * construit avec les contenus de test (tests/fixtures/site). Toute nouvelle page, ou tout
 * nouveau modèle de page, s'ajoute ici.
 */
export const pages = [
  { nom: 'accueil', chemin: '/' },
  { nom: 'annuaire', chemin: '/annuaire/' },
  { nom: 'fiche acteur', chemin: '/annuaire/velo-test-riom/' },
  { nom: 'fiche acteur sans adresse', chemin: '/annuaire/atelier-mobile-test/' },
  { nom: 'agenda', chemin: '/agenda/' },
  { nom: 'communes', chemin: '/communes/' },
  { nom: 'page commune', chemin: '/communes/riom/' },
  { nom: 'fiche événement', chemin: '/agenda/2099-06-14-bourse-test-riom/' },
  { nom: 'événement annulé', chemin: '/agenda/2099-06-21-sortie-test-annulee/' },
  { nom: 'proposer un événement', chemin: '/agenda/proposer/' },
  { nom: 'proposition reçue', chemin: '/agenda/proposer/merci/' },
  { nom: 'proposition non envoyée', chemin: '/agenda/proposer/erreur/' },
  { nom: 'espace organisateur : connexion', chemin: '/organisateur/connexion/' },
  { nom: 'espace organisateur : lien envoyé', chemin: '/organisateur/lien-envoye/' },
  { nom: 'espace organisateur : gabarit', chemin: '/organisateur/gabarit/' },
  { nom: 'itinéraires', chemin: '/itineraires/' },
  { nom: 'fiche itinéraire', chemin: '/itineraires/boucle-test-volvic/' },
  { nom: 'actus', chemin: '/actus/' },
  { nom: 'article', chemin: '/actus/2026-10-01-article-test/' },
  { nom: 'brève', chemin: '/actus/2026-10-05-breve-test/' },
  { nom: 'à propos', chemin: '/a-propos/' },
  { nom: 'mentions légales', chemin: '/mentions-legales/' },
  { nom: 'hors connexion', chemin: '/hors-ligne/' },
] as const;
