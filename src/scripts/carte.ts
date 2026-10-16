/**
 * Carte interactive de l'annuaire, chargée seulement à la demande (bouton) : Leaflet et ses
 * styles ne sont téléchargés que par ceux qui ouvrent la carte. La liste de l'annuaire reste
 * l'accès complet à l'information ; la carte en est une autre vue.
 */
import { CARTE } from '@config/carte';
import type { CollectionPoints, ProprietesPoint } from '@lib/geojson';

function contenuInfobulle(point: ProprietesPoint): HTMLElement {
  const bloc = document.createElement('div');
  const lien = document.createElement('a');
  lien.href = point.url;
  lien.textContent = point.nom;
  const titre = document.createElement('strong');
  titre.append(lien);
  const details = document.createElement('p');
  details.textContent = `${point.categories} · ${point.commune}${point.membre ? ' · membre' : ''}`;
  bloc.append(titre, details);
  return bloc;
}

async function afficherCarte(conteneur: HTMLElement, etat: HTMLElement): Promise<void> {
  const [{ default: L }, reponse] = await Promise.all([
    import('leaflet'),
    fetch(CARTE.urlDonnees),
    import('leaflet/dist/leaflet.css'),
  ]);
  await import('leaflet.markercluster');
  await Promise.all([
    import('leaflet.markercluster/dist/MarkerCluster.css'),
    import('leaflet.markercluster/dist/MarkerCluster.Default.css'),
  ]);
  if (!reponse.ok)
    throw new Error(`Points de l'annuaire indisponibles (${String(reponse.status)})`);
  const points = (await reponse.json()) as CollectionPoints;

  conteneur.hidden = false;
  const carte = L.map(conteneur, { scrollWheelZoom: false }).setView(
    [...CARTE.centre],
    CARTE.zoomInitial,
  );
  L.tileLayer(CARTE.urlTuiles, {
    maxZoom: CARTE.zoomMax,
    attribution: CARTE.attribution,
  }).addTo(carte);

  // Icône dessinée en CSS (pas d'image) ; marqueur focalisable au clavier, nommé.
  const icone = L.divIcon({ className: 'carte__point', iconSize: [18, 18] });
  const groupe = L.markerClusterGroup({ showCoverageOnHover: false });
  for (const { geometry, properties } of points.features) {
    const [lon, lat] = geometry.coordinates;
    groupe.addLayer(
      L.marker([lat, lon], { icon: icone, title: properties.nom, alt: properties.nom }).bindPopup(
        contenuInfobulle(properties),
      ),
    );
  }
  carte.addLayer(groupe);
  if (points.features.length > 0) {
    carte.fitBounds(groupe.getBounds(), { padding: [24, 24], maxZoom: 13 });
  }
  etat.textContent = `${String(points.features.length)} acteur(s) placé(s) sur la carte.`;
}

for (const bouton of document.querySelectorAll<HTMLButtonElement>('[data-ouvrir-carte]')) {
  const conteneur = document.getElementById(bouton.getAttribute('aria-controls') ?? '');
  const etat = document.getElementById(bouton.dataset.ouvrirCarte ?? '');
  if (conteneur === null || etat === null) continue;
  bouton.addEventListener(
    'click',
    () => {
      bouton.disabled = true;
      bouton.setAttribute('aria-expanded', 'true');
      etat.textContent = 'Chargement de la carte…';
      afficherCarte(conteneur, etat)
        .then(() => {
          bouton.hidden = true;
        })
        .catch(() => {
          bouton.disabled = false;
          bouton.setAttribute('aria-expanded', 'false');
          etat.textContent =
            'La carte est indisponible pour le moment (elle demande une connexion).';
        });
    },
    { once: false },
  );
}
