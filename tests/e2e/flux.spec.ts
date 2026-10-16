/** Exports de l'agenda et des actualités (iCal, RSS), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('l’agenda complet s’exporte en iCal, sans l’à-valider', async ({ request }) => {
  const reponse = await request.get('/agenda.ics');
  expect(reponse.status()).toBe(200);
  const ics = await reponse.text();
  expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  expect(ics).toContain('UID:2099-06-14-bourse-test-riom@pedalerenauvergne.fr');
  expect(ics).toContain('STATUS:CANCELLED');
  expect(ics).not.toContain('Atelier de test à valider');
});

test('la fiche événement propose son fichier iCal', async ({ page }) => {
  await page.goto('/agenda/2099-06-14-bourse-test-riom/');
  const lien = page.getByRole('link', { name: 'Ajouter à mon calendrier' });
  await expect(lien).toHaveAttribute('href', '/agenda/2099-06-14-bourse-test-riom.ics');
  const ics = await (await page.request.get('/agenda/2099-06-14-bourse-test-riom.ics')).text();
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(ics).toContain('SUMMARY:Bourse aux vélos de test');
});

test('un événement annulé ne propose pas l’ajout au calendrier', async ({ page }) => {
  await page.goto('/agenda/2099-06-21-sortie-test-annulee/');
  await expect(page.getByRole('link', { name: 'Ajouter à mon calendrier' })).toHaveCount(0);
});

test('les flux RSS listent les contenus publiés', async ({ page }) => {
  await page.goto('/agenda/');
  await expect(page.getByRole('link', { name: "S'abonner au calendrier (iCal)" })).toHaveAttribute(
    'href',
    '/agenda.ics',
  );
  const agenda = await (await page.request.get('/agenda/rss.xml')).text();
  expect(agenda).toContain('<title>Bourse aux vélos de test — Riom</title>');
  expect(agenda).not.toContain('Fête du vélo de test passée');

  const actus = await (await page.request.get('/actus/rss.xml')).text();
  expect(actus).toContain('<rss version="2.0"');
  expect(actus).not.toContain('Actu de test en brouillon');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(2);
});
