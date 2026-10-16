/** Création d'une issue par l'API GitHub, avec un jeton limité aux issues du dépôt. */
import { z } from 'astro/zod';
import { FORMULAIRES } from '@config/formulaires';
import type { IssueGithub } from './evenement';

const schemaReponse = z.object({ number: z.number().int(), html_url: z.url() });

export interface IssueCreee {
  numero: number;
  url: string;
}

export async function creerIssue(
  issue: IssueGithub,
  jeton: string,
  recuperer: typeof fetch,
): Promise<IssueCreee> {
  const { proprietaire, nom } = FORMULAIRES.depot;
  const reponse = await recuperer(`https://api.github.com/repos/${proprietaire}/${nom}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jeton}`,
      'Content-Type': 'application/json',
      'User-Agent': 'pedaler-en-auvergne-formulaire',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title: issue.titre, body: issue.corps, labels: issue.etiquettes }),
  });
  if (reponse.status !== 201) {
    throw new Error(`GitHub a répondu ${String(reponse.status)}.`);
  }
  const { number, html_url } = schemaReponse.parse(await reponse.json());
  return { numero: number, url: html_url };
}
