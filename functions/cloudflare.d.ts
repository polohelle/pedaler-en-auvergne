/** Types minimaux de l'environnement Cloudflare utilisés par les fonctions Pages. */
interface ElementHTMLRewriter {
  setInnerContent: (contenu: string, options?: { html: boolean }) => ElementHTMLRewriter;
}

declare class HTMLRewriter {
  on(selecteur: string, gestionnaire: { element: (element: ElementHTMLRewriter) => void }): this;
  transform(reponse: Response): Response;
}
