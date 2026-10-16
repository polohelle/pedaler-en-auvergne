import { describe, expect, it, vi } from 'vitest';
import { pageApres, traiterPropositionEvenement, type Dependances } from './traitement';

const champs = {
  titre: 'Balade des feuilles mortes',
  type: 'sortie',
  jour_debut: '2026-11-08',
  heure_debut: '09:30',
  lieu: 'Place de Jaude',
  commune: 'Clermont-Ferrand',
  description: 'Balade tranquille de 20 km, ouverte à tous.',
  source_url: 'https://exemple.fr/balade',
  'cf-turnstile-response': 'jeton',
};

const issue = { numero: 42, url: 'https://github.com/polohelle/pedaler-en-auvergne/issues/42' };

function dependances(
  surcharges: { [Cle in keyof Dependances]?: Dependances[Cle] | undefined } = {},
) {
  const base = {
    maintenant: new Date('2026-10-16T12:00:00+02:00'),
    verifierJeton: vi.fn<Dependances['verifierJeton']>().mockResolvedValue(true),
    creerIssue: vi.fn<Dependances['creerIssue']>().mockResolvedValue(issue),
    transmettreAdresse: vi.fn<NonNullable<Dependances['transmettreAdresse']>>().mockResolvedValue(),
    journaliser: vi.fn<Dependances['journaliser']>(),
  };
  return { ...base, ...surcharges } as typeof base;
}

describe('traiterPropositionEvenement', () => {
  it('crée l’issue d’une proposition valide', async () => {
    const d = dependances();
    await expect(traiterPropositionEvenement(champs, d)).resolves.toEqual({
      statut: 'envoyee',
      numero: 42,
    });
    expect(d.verifierJeton).toHaveBeenCalledWith('jeton');
    expect(d.creerIssue.mock.calls[0]?.[0].titre).toBe('[Événement] Balade des feuilles mortes');
    expect(d.transmettreAdresse).not.toHaveBeenCalled();
  });

  it('transmet l’adresse de l’auteur à part', async () => {
    const d = dependances();
    await traiterPropositionEvenement({ ...champs, courriel: 'auteur@exemple.fr' }, d);
    expect(d.transmettreAdresse).toHaveBeenCalledWith(issue, 'auteur@exemple.fr');
    expect(d.creerIssue.mock.calls[0]?.[0].corps).not.toContain('auteur@exemple.fr');
  });

  it('ignore en silence un robot pris au piège', async () => {
    const d = dependances();
    await expect(
      traiterPropositionEvenement({ ...champs, site_web: 'https://spam.example' }, d),
    ).resolves.toEqual({ statut: 'piege' });
    expect(d.verifierJeton).not.toHaveBeenCalled();
    expect(d.creerIssue).not.toHaveBeenCalled();
  });

  it('refuse sans jeton anti-robot valide', async () => {
    const sansJeton = Object.fromEntries(
      Object.entries(champs).filter(([nom]) => nom !== 'cf-turnstile-response'),
    );
    await expect(traiterPropositionEvenement(sansJeton, dependances())).resolves.toEqual({
      statut: 'verification',
    });
    const d = dependances({ verifierJeton: vi.fn().mockResolvedValue(false) });
    await expect(traiterPropositionEvenement(champs, d)).resolves.toEqual({
      statut: 'verification',
    });
    expect(d.creerIssue).not.toHaveBeenCalled();
  });

  it('refuse une saisie invalide en journalisant les seuls noms de champs', async () => {
    const d = dependances();
    const resultat = await traiterPropositionEvenement(
      { ...champs, description: 'Appeler le 06 12 34 56 78 pour s’inscrire.' },
      d,
    );
    expect(resultat.statut).toBe('invalide');
    expect(d.journaliser).toHaveBeenCalledWith('Proposition refusée : description.');
    expect(d.creerIssue).not.toHaveBeenCalled();
  });

  it('signale un échec de GitHub', async () => {
    const d = dependances({
      creerIssue: vi.fn().mockRejectedValue(new Error('GitHub a répondu 500.')),
    });
    await expect(traiterPropositionEvenement(champs, d)).resolves.toEqual({ statut: 'echec' });
    expect(d.journaliser).toHaveBeenCalledWith(
      "Création de l'issue impossible : GitHub a répondu 500.",
    );
    const d2 = dependances({ creerIssue: vi.fn().mockRejectedValue('?') });
    await traiterPropositionEvenement(champs, d2);
    expect(d2.journaliser).toHaveBeenCalledWith("Création de l'issue impossible : erreur inconnue");
  });

  it('garde l’issue si l’adresse ne peut pas être transmise, sans la journaliser', async () => {
    const avecAdresse = { ...champs, courriel: 'auteur@exemple.fr' };
    const sansCanal = dependances({ transmettreAdresse: undefined });
    await expect(traiterPropositionEvenement(avecAdresse, sansCanal)).resolves.toMatchObject({
      statut: 'envoyee',
    });
    expect(sansCanal.journaliser).toHaveBeenCalledWith(
      "Issue #42 : aucun canal pour transmettre l'adresse.",
    );
    const enPanne = dependances({ transmettreAdresse: vi.fn().mockRejectedValue(new Error('x')) });
    await expect(traiterPropositionEvenement(avecAdresse, enPanne)).resolves.toMatchObject({
      statut: 'envoyee',
    });
    expect(enPanne.journaliser).toHaveBeenCalledWith(
      "Issue #42 : transmission de l'adresse impossible.",
    );
    expect(JSON.stringify(enPanne.journaliser.mock.calls)).not.toContain('auteur@exemple.fr');
  });
});

describe('pageApres', () => {
  it('renvoie vers la bonne page', () => {
    expect(pageApres({ statut: 'envoyee', numero: 1 })).toBe('/agenda/proposer/merci/');
    expect(pageApres({ statut: 'piege' })).toBe('/agenda/proposer/merci/');
    expect(pageApres({ statut: 'verification' })).toBe('/agenda/proposer/erreur/#verification');
    expect(pageApres({ statut: 'invalide', erreurs: [] })).toBe('/agenda/proposer/erreur/#saisie');
    expect(pageApres({ statut: 'echec' })).toBe('/agenda/proposer/erreur/#indisponible');
  });
});
