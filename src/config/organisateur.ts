/**
 * Espace organisateur (ADR 0038) : comptes par lien de connexion envoyé par e-mail, événements
 * en brouillon dans Cloudflare D1, envoi pour vérification par une issue GitHub. Aucune valeur
 * secrète ici : la base D1, la clé Turnstile, le jeton GitHub et le Worker d'envoi sont des
 * liaisons et des variables du projet Cloudflare Pages.
 */
export const ORGANISATEUR = {
  /** Racine de l'espace ; tout ce qui est dessous passe par la fonction de l'espace. */
  racine: '/organisateur/',
  pages: {
    tableauDeBord: '/organisateur/',
    connexion: '/organisateur/connexion/',
    lienEnvoye: '/organisateur/lien-envoye/',
    confirmer: '/organisateur/confirmer/',
    deconnexion: '/organisateur/deconnexion/',
    structure: '/organisateur/structure/',
    nouvelEvenement: '/organisateur/evenements/nouveau/',
    /** Page statique de mise en page, remplie par la fonction (titre et contenu). */
    gabarit: '/organisateur/gabarit/',
  },
  /** Cookie de session : préfixe `__Host-` (HTTPS, sans domaine, chemin `/`). */
  cookie: '__Host-organisateur',
  /** Durée de validité du lien de connexion, en minutes. */
  dureeLienMinutes: 30,
  /** Liens demandés au plus pour une même adresse pendant la durée de validité. */
  liensMaxParAdresse: 3,
  /** Durée d'une session, en jours. */
  dureeSessionJours: 30,
  /** Mois proposés dans le calendrier, à partir du mois en cours. */
  moisCalendrier: 12,
  /** Mois dépliés d'office ; les suivants sont dans un bloc à ouvrir. */
  moisOuverts: 3,
  /** Dates au plus pour un même événement. */
  datesMax: 60,
  longueurs: { structure: 120 },
} as const;
