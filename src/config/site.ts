/** Identité et constantes du site. */
export const SITE = {
  nom: 'Pédaler en Auvergne',
  slogan: 'Le réseau des acteurs du vélo',
  description:
    'Le réseau des acteurs du vélo en Auvergne : annuaire, agenda et actualités du vélo local.',
  url: 'https://pedalerenauvergne.fr',
  langue: 'fr',
  couleurTheme: '#ffffff',
  couleurFond: '#ffffff',
  /** Image de partage par défaut (Open Graph), quand la page n'en a pas. */
  imagePartage: '/pwa-512x512.png',
  depot: 'https://github.com/polohelle/pedaler-en-auvergne',
  /** Compte Instagram du site, qui relaie agenda, itinéraires, acteurs et actus. */
  instagram: 'https://www.instagram.com/pedalerenauvergne/',
  /** Page Facebook du site, jumelle du compte Instagram. */
  facebook: 'https://www.facebook.com/pedalerenauvergne/',
} as const;
