/**
 * Fragments HTML de l'espace organisateur, rendus par la fonction Cloudflare. Toute valeur
 * insérée est échappée, sauf un fragment déjà construit par `balisage` : un texte saisi ne peut
 * jamais devenir du balisage.
 */

/** Fragment HTML sûr : seul `balisage` en fabrique. */
export class Html {
  readonly #texte: string;
  constructor(texte: string) {
    this.#texte = texte;
  }
  toString(): string {
    return this.#texte;
  }
}

const ENTITES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ENTITES[c] ?? c);
}

export type Valeur = Html | string | number | boolean | null | undefined | readonly Valeur[];

function rendre(valeur: Valeur): string {
  if (valeur instanceof Html) return valeur.toString();
  if (Array.isArray(valeur)) return (valeur as readonly Valeur[]).map(rendre).join('');
  if (valeur === null || valeur === undefined || valeur === false) return '';
  if (valeur === true) return '';
  return echapper(String(valeur));
}

/** Gabarit étiqueté : `balisage\`<p>${texte}</p>\``. Les valeurs fausses ou vides ne rendent rien. */
export function balisage(morceaux: TemplateStringsArray, ...valeurs: Valeur[]): Html {
  let resultat = morceaux[0] ?? '';
  valeurs.forEach((valeur, rang) => {
    resultat += rendre(valeur) + (morceaux[rang + 1] ?? '');
  });
  return new Html(resultat);
}

/** Attribut booléen (`checked`, `disabled`…) présent seulement si la condition est vraie. */
export function attribut(nom: string, present: boolean): Html {
  return new Html(present ? ` ${nom}` : '');
}
