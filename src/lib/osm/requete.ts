/** Requête Overpass des acteurs vélo d'un département. */
import type { CodeDepartement } from '@config/departements';

/**
 * Commerces vélo (`shop=bicycle`), tout commerce qui vend, répare, loue ou revend des vélos
 * (`service:bicycle:*=yes`), et loueurs à guichet (`amenity=bicycle_rental` + `bicycle_rental=shop`).
 * Les stations en libre-service, bornes de réparation et parkings sont écartés ensuite.
 */
export function requeteOverpass(departement: CodeDepartement): string {
  const filtres = [
    '["shop"="bicycle"]',
    '["service:bicycle:retail"="yes"]',
    '["service:bicycle:repair"="yes"]',
    '["service:bicycle:rental"="yes"]',
    '["service:bicycle:second_hand"~"^(yes|only)$"]',
    '["amenity"="bicycle_rental"]["bicycle_rental"="shop"]',
  ];
  return [
    '[out:json][timeout:120];',
    `area["ISO3166-2"="FR-${departement}"]["admin_level"="6"]->.departement;`,
    '(',
    ...filtres.map((filtre) => `  nwr${filtre}(area.departement);`),
    ');',
    'out center tags;',
  ].join('\n');
}
