/**
 * Anti-robot Cloudflare Turnstile du formulaire, chargé seulement quand la personne commence à
 * remplir le formulaire : aucune requête vers Cloudflare pour qui ne fait que lire la page.
 * Sans ce script, la fonction refuse l'envoi et la page d'erreur l'explique.
 */
import { FORMULAIRES } from '@config/formulaires';

interface Turnstile {
  render: (conteneur: HTMLElement, options: Record<string, unknown>) => string;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

function chargerScript(): Promise<Turnstile> {
  return new Promise((resoudre, rejeter) => {
    const script = document.createElement('script');
    script.src = FORMULAIRES.urlTurnstile;
    script.async = true;
    script.addEventListener('load', () => {
      if (window.turnstile === undefined) {
        rejeter(new Error('Turnstile absent'));
      } else {
        resoudre(window.turnstile);
      }
    });
    script.addEventListener('error', () => {
      rejeter(new Error('Turnstile injoignable'));
    });
    document.head.append(script);
  });
}

function initialiser(formulaire: HTMLFormElement): void {
  const conteneur = formulaire.querySelector<HTMLElement>('[data-turnstile]');
  const etat = formulaire.querySelector<HTMLElement>('[data-etat-turnstile]');
  const cle = conteneur?.dataset.turnstile;
  if (conteneur === null || etat === null || cle === undefined) {
    return;
  }
  // Tant que la vérification est en cours, l'envoi attend ; en cas d'échec, il part quand même
  // et la fonction renvoie vers la page d'erreur, qui explique quoi faire.
  let etatVerification: 'attente' | 'reussie' | 'echec' = 'attente';

  const demarrer = (): void => {
    etat.textContent = 'Vérification anti-robot en cours…';
    chargerScript()
      .then((turnstile) => {
        turnstile.render(conteneur, {
          sitekey: cle,
          language: 'fr',
          callback: () => {
            etatVerification = 'reussie';
            etat.textContent = 'Vérification anti-robot réussie.';
          },
          'expired-callback': () => {
            etatVerification = 'attente';
          },
          'error-callback': () => {
            etatVerification = 'echec';
            etat.textContent = 'La vérification anti-robot a échoué : rechargez la page.';
          },
        });
      })
      .catch(() => {
        etatVerification = 'echec';
        etat.textContent =
          'La vérification anti-robot n’a pas pu se charger : vérifiez votre connexion puis rechargez la page.';
      });
  };
  formulaire.addEventListener('focusin', demarrer, { once: true });

  formulaire.addEventListener('submit', (evenement) => {
    if (etatVerification === 'attente') {
      evenement.preventDefault();
      etat.textContent =
        'Patientez quelques secondes : la vérification anti-robot n’est pas terminée.';
    }
  });
}

for (const formulaire of document.querySelectorAll<HTMLFormElement>('form[data-anti-robot]')) {
  initialiser(formulaire);
}
