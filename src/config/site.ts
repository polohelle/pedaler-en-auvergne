/** Identité et constantes du site. */
export const SITE = {
  nom: 'Pédaler en Auvergne',
  slogan: 'Le réseau des acteurs du vélo',
  description:
    'Le réseau des acteurs du vélo du Puy-de-Dôme : annuaire, agenda et actualités du vélo local.',
  url: 'https://pedalerenauvergne.fr',
  langue: 'fr',
  couleurTheme: '#1f5f3f',
  couleurFond: '#ffffff',
  /** Formulaire d'adhésion HelloAsso ; `null` tant que la page de l'association n'existe pas. */
  adhesionUrl: null as string | null,
  depot: 'https://github.com/polohelle/pedaler-en-auvergne',
} as const;
