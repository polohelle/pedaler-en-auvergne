import { describe, expect, it } from 'vitest';
import {
  datesConsecutives,
  estUnJour,
  libelleDuJour,
  moisCalendrier,
  trierDates,
} from './calendrier';

describe('moisCalendrier', () => {
  const mois = moisCalendrier('2026-10-19', 3);

  it('part du mois en cours', () => {
    expect(mois.map((m) => m.cle)).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(mois[0]?.libelle).toBe('octobre 2026');
  });

  it('donne tous les jours du mois et la colonne du premier (lundi = 1)', () => {
    expect(mois[0]?.jours).toHaveLength(31);
    expect(mois[1]?.jours).toHaveLength(30);
    // 1er octobre 2026 : jeudi ; 1er novembre 2026 : dimanche.
    expect(mois[0]?.colonneDuPremier).toBe(4);
    expect(mois[1]?.colonneDuPremier).toBe(7);
  });

  it('marque les jours passés', () => {
    const octobre = mois[0]?.jours ?? [];
    expect(octobre.find((j) => j.jour === '2026-10-18')?.passe).toBe(true);
    expect(octobre.find((j) => j.jour === '2026-10-19')?.passe).toBe(false);
  });

  it('passe d’une année à l’autre et nomme chaque jour', () => {
    const suite = moisCalendrier('2026-12-31', 2);
    expect(suite[1]?.cle).toBe('2027-01');
    expect(suite[1]?.jours[0]?.libelle).toBe('vendredi 1 janvier 2027');
  });

  it('refuse un jour mal formé', () => {
    expect(() => moisCalendrier('19/10/2026', 1)).toThrow(RangeError);
  });
});

describe('dates', () => {
  it('reconnaît un jour qui existe', () => {
    expect(estUnJour('2026-02-28')).toBe(true);
    expect(estUnJour('2026-02-29')).toBe(false);
    expect(estUnJour('2026-2-1')).toBe(false);
  });

  it('trie et dédoublonne', () => {
    expect(trierDates(['2026-11-10', '2026-11-03', '2026-11-10'])).toEqual([
      '2026-11-03',
      '2026-11-10',
    ]);
  });

  it('reconnaît des jours consécutifs, même d’un mois à l’autre', () => {
    expect(datesConsecutives(['2026-11-01', '2026-10-31'])).toBe(true);
    expect(datesConsecutives(['2026-11-01', '2026-11-03'])).toBe(false);
    expect(datesConsecutives(['2026-11-01'])).toBe(false);
  });

  it('écrit un jour en toutes lettres', () => {
    expect(libelleDuJour('2026-11-03')).toBe('mardi 3 novembre 2026');
  });
});
