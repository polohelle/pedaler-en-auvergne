import { describe, expect, it } from 'vitest';
import {
  cookieEfface,
  cookieSession,
  empreinte,
  estUnJeton,
  jetonAleatoire,
  lireCookie,
  plusMinutes,
} from './jetons';

describe('jetons', () => {
  it('tire des jetons base64url de 256 bits, tous différents', () => {
    const a = jetonAleatoire();
    expect(estUnJeton(a)).toBe(true);
    expect(jetonAleatoire()).not.toBe(a);
  });

  it('reconnaît la forme d’un jeton', () => {
    expect(estUnJeton(null)).toBe(false);
    expect(estUnJeton('court')).toBe(false);
    expect(estUnJeton(`${'a'.repeat(42)}+`)).toBe(false);
  });

  it('calcule l’empreinte SHA-256 en hexadécimal', async () => {
    expect(await empreinte('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('cookies', () => {
  it('lit un cookie parmi d’autres', () => {
    expect(lireCookie('a=1; __Host-organisateur=x=y; b=2', '__Host-organisateur')).toBe('x=y');
    expect(lireCookie('a=1', '__Host-organisateur')).toBeUndefined();
    expect(lireCookie(null, '__Host-organisateur')).toBeUndefined();
  });

  it('pose un cookie de session protégé, et l’efface', () => {
    expect(cookieSession('j')).toBe(
      '__Host-organisateur=j; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000',
    );
    expect(cookieEfface()).toContain('Max-Age=0');
  });

  it('ajoute des minutes', () => {
    expect(plusMinutes(new Date('2026-10-19T10:00:00Z'), 30).toISOString()).toBe(
      '2026-10-19T10:30:00.000Z',
    );
  });
});
