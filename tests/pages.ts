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
  { nom: 'fiche événement', chemin: '/agenda/2099-06-14-bourse-test-riom/' },
  { nom: 'événement annulé', chemin: '/agenda/2099-06-21-sortie-test-annulee/' },
  { nom: 'actus', chemin: '/actus/' },
  { nom: 'article', chemin: '/actus/2026-10-01-article-test/' },
  { nom: 'brève', chemin: '/actus/2026-10-05-breve-test/' },
  { nom: 'association', chemin: '/association/' },
  { nom: 'charte', chemin: '/association/charte/' },
  { nom: 'gouvernance', chemin: '/association/gouvernance/' },
  { nom: 'membres', chemin: '/association/membres/' },
  { nom: 'adhérer', chemin: '/association/adherer/' },
  { nom: 'contact', chemin: '/association/contact/' },
  { nom: 'mentions légales', chemin: '/mentions-legales/' },
  { nom: 'hors connexion', chemin: '/hors-ligne/' },
] as const;
