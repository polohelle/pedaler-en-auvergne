/** Types minimaux du module `cloudflare:email` fourni par l'environnement Cloudflare. */
declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(de: string, a: string, brut: string);
    readonly from: string;
    readonly to: string;
  }
}
