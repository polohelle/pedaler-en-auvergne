import { describe, expect, it } from 'vitest';
import { lieuPedaler, listerCommunes, regrouperParCommune, resumerCommune } from './communes';

describe('lieuPedaler', () => {
  it('emploie « à » par défaut', () => {
    expect(lieuPedaler('Riom')).toBe('à Riom');
    expect(lieuPedaler('Clermont-Ferrand')).toBe('à Clermont-Ferrand');
  });

  it('contracte « à le » en « au » et « à les » en « aux »', () => {
    expect(lieuPedaler('Le Cendre')).toBe('au Cendre');
    expect(lieuPedaler('Les Martres-de-Veyre')).toBe('aux Martres-de-Veyre');
    expect(lieuPedaler('Le Puy-en-Velay')).toBe('au Puy-en-Velay');
  });

  it('garde « La » et « L’ » dans le nom', () => {
    expect(lieuPedaler('La Bourboule')).toBe('à La Bourboule');
    expect(lieuPedaler("L'Hospitalet")).toBe("à L'Hospitalet");
  });

  it('ne confond pas un nom qui commence par « Le » sans article', () => {
    expect(lieuPedaler('Lezoux')).toBe('à Lezoux');
    expect(lieuPedaler('Lempdes')).toBe('à Lempdes');
  });
});

describe('listerCommunes', () => {
  it('dédoublonne, garde la première orthographe et trie en français', () => {
    expect(listerCommunes(['Riom', 'Cébazat', 'riom ', 'Ambert', 'Écully'])).toEqual([
      { slug: 'ambert', nom: 'Ambert' },
      { slug: 'cebazat', nom: 'Cébazat' },
      { slug: 'ecully', nom: 'Écully' },
      { slug: 'riom', nom: 'Riom' },
    ]);
  });

  it('ignore les noms vides', () => {
    expect(listerCommunes(['', '  '])).toEqual([]);
  });
});

describe('regrouperParCommune', () => {
  it('range par identifiant de commune en gardant l’ordre', () => {
    const groupes = regrouperParCommune(
      [
        { nom: 'A', commune: 'Riom' },
        { nom: 'B', commune: 'Thiers' },
        { nom: 'C', commune: 'riom' },
      ],
      (e) => e.commune,
    );
    expect([...groupes.keys()]).toEqual(['riom', 'thiers']);
    expect(groupes.get('riom')?.map((e) => e.nom)).toEqual(['A', 'C']);
  });
});

describe('resumerCommune', () => {
  it('accorde et omet les zéros', () => {
    expect(resumerCommune(1, 0)).toBe('1 acteur');
    expect(resumerCommune(3, 0)).toBe('3 acteurs');
    expect(resumerCommune(0, 1)).toBe('1 événement à venir');
    expect(resumerCommune(2, 2)).toBe('2 acteurs, 2 événements à venir');
  });
});
