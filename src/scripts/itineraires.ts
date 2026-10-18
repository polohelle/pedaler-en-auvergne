/**
 * Carte et filtres des itinéraires (ADR 0036). La carte, sur fond IGN, est chargée dès
 * l'ouverture de la page ; les filtres masquent les mêmes parcours dans la liste et sur la carte
 * et reportent la sélection dans l'adresse, pour la partager par un lien. La logique de tri est
 * dans src/lib/itineraires.ts ; ce fichier ne fait que relier la page, Leaflet et cette logique.
 */
import type { FeatureGroup, Map as CarteLeaflet } from 'leaflet';
import { CARTE_ITINERAIRES } from '@config/carte';
import { LIBELLES_DIFFICULTE, LIBELLES_PRATIQUE_ITINERAIRE } from '@config/itineraires';
import {
  correspond,
  ecrireCriteres,
  formaterDenivele,
  formaterDistance,
  lireCaracteristiques,
  lireCriteres,
  resumeFiltres,
  type CollectionLignes,
  type Criteres,
  type ProprietesLigne,
} from '@lib/itineraires';

/** Parcours visibles selon les filtres ; `null` tant qu'aucun filtre n'est actif. */
let visibles: ReadonlySet<string> | null = null;
let surFiltrage: ((ids: ReadonlySet<string> | null) => void) | undefined;

// --- Carte ------------------------------------------------------------------------------------

function contenuInfobulle(ligne: ProprietesLigne): HTMLElement {
  const bloc = document.createElement('div');
  const lien = document.createElement('a');
  lien.href = ligne.url;
  lien.textContent = ligne.titre;
  const titre = document.createElement('strong');
  titre.append(lien);
  const details = document.createElement('p');
  details.textContent = [
    LIBELLES_PRATIQUE_ITINERAIRE[ligne.pratique],
    formaterDistance(ligne.distanceKm),
    ...(ligne.deniveleM === undefined ? [] : [formaterDenivele(ligne.deniveleM)]),
    LIBELLES_DIFFICULTE[ligne.difficulte],
  ].join(' · ');
  bloc.append(titre, details);
  return bloc;
}

async function afficherCarte(conteneur: HTMLElement, etat: HTMLElement): Promise<void> {
  const [{ default: L }, reponse] = await Promise.all([
    import('leaflet'),
    fetch(CARTE_ITINERAIRES.urlDonnees),
    import('leaflet/dist/leaflet.css'),
  ]);
  if (!reponse.ok) throw new Error(`Traces indisponibles (${String(reponse.status)})`);
  const lignes = (await reponse.json()) as CollectionLignes;
  const seul = conteneur.dataset.seul;
  const parcours = lignes.features.filter((f) => seul === undefined || f.properties.id === seul);

  const carte: CarteLeaflet = L.map(conteneur, { scrollWheelZoom: false }).setView(
    [...CARTE_ITINERAIRES.centre],
    CARTE_ITINERAIRES.zoomInitial,
  );
  const fonds = Object.fromEntries(
    CARTE_ITINERAIRES.fonds.map(({ nom, url, zoomMax }) => [
      nom,
      L.tileLayer(url, { maxZoom: zoomMax, attribution: CARTE_ITINERAIRES.attribution }),
    ]),
  );
  Object.values(fonds)[0]?.addTo(carte);
  const { courbes } = CARTE_ITINERAIRES;
  L.control
    .layers(fonds, { [courbes.nom]: L.tileLayer(courbes.url, { maxZoom: courbes.zoomMax }) })
    .addTo(carte);

  const icones = new Map<string, ReturnType<typeof L.divIcon>>();
  const groupes = new Map<string, FeatureGroup>();
  for (const { geometry, properties } of parcours) {
    const positions = geometry.coordinates.map((segment) =>
      segment.map(([lon, lat]): [number, number] => [lat, lon]),
    );
    const infobulle = contenuInfobulle(properties);
    const halo = L.polyline(positions, { className: 'trace__halo', interactive: false });
    const trace = L.polyline(positions, { className: `trace trace--${properties.pratique}` });
    const depart = positions[0]?.[0];
    const icone =
      icones.get(properties.pratique) ??
      L.divIcon({
        className: `carte__depart carte__depart--${properties.pratique}`,
        iconSize: [16, 16],
      });
    icones.set(properties.pratique, icone);
    const groupe = L.featureGroup([halo, trace]);
    if (depart !== undefined) {
      const nom = `Départ : ${properties.titre}`;
      groupe.addLayer(L.marker(depart, { icon: icone, title: nom, alt: nom }));
    }
    groupe.bindPopup(infobulle);
    groupe.on('mouseover', () => groupe.bringToFront());
    groupes.set(properties.id, groupe);
  }

  /** Affiche les parcours retenus et cadre la carte sur eux. */
  const appliquer = (ids: ReadonlySet<string> | null) => {
    const retenus: FeatureGroup[] = [];
    for (const [id, groupe] of groupes) {
      if (ids === null || ids.has(id)) {
        groupe.addTo(carte);
        retenus.push(groupe);
      } else {
        groupe.remove();
      }
    }
    if (retenus.length > 0) {
      carte.fitBounds(L.featureGroup(retenus).getBounds(), { padding: [24, 24], maxZoom: 14 });
    }
  };
  appliquer(seul === undefined ? visibles : null);
  if (seul === undefined) surFiltrage = appliquer;
  etat.textContent =
    seul === undefined
      ? `${String(parcours.length)} parcours tracé(s) sur la carte.`
      : 'Trace du parcours sur fond IGN.';
}

for (const conteneur of document.querySelectorAll<HTMLElement>('[data-carte-itineraires]')) {
  const etat = document.getElementById(conteneur.dataset.carteItineraires ?? '');
  if (etat === null) continue;
  etat.textContent = 'Chargement de la carte…';
  afficherCarte(conteneur, etat).catch(() => {
    conteneur.hidden = true;
    etat.textContent =
      'La carte est indisponible pour le moment (elle demande une connexion) ; la liste des parcours reste consultable.';
  });
}

// --- Filtres ----------------------------------------------------------------------------------

function remplir(formulaire: HTMLFormElement, criteres: Criteres): void {
  const coches = new Set<string>([
    ...criteres.pratiques.map((p) => `pratique=${p}`),
    ...criteres.difficultes.map((d) => `difficulte=${d}`),
    ...(criteres.boucle ? ['boucle=oui'] : []),
    ...(criteres.balise ? ['balise=oui'] : []),
  ]);
  for (const caseACocher of formulaire.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) {
    caseACocher.checked = coches.has(`${caseACocher.name}=${caseACocher.value}`);
  }
  const listes = {
    distance: criteres.distance,
    denivele: criteres.denivele,
    commune: criteres.commune,
  };
  for (const [nom, valeur] of Object.entries(listes)) {
    const liste = formulaire.elements.namedItem(nom);
    if (liste instanceof HTMLSelectElement) liste.value = valeur;
  }
}

function filtrer(
  formulaire: HTMLFormElement,
  resume: HTMLElement,
  elements: readonly HTMLElement[],
  communes: readonly string[],
): void {
  const criteres = lireCriteres(new FormData(formulaire), communes);
  const ids = new Set<string>();
  for (const element of elements) {
    const caracteristiques = lireCaracteristiques(element.dataset);
    const garde = caracteristiques !== undefined && correspond(caracteristiques, criteres);
    element.hidden = !garde;
    if (garde && element.dataset.itineraire !== undefined) ids.add(element.dataset.itineraire);
  }
  const parametres = ecrireCriteres(criteres).toString();
  visibles = parametres === '' ? null : ids;
  surFiltrage?.(visibles);
  resume.textContent = resumeFiltres(ids.size, elements.length);
  history.replaceState(null, '', parametres === '' ? location.pathname : `?${parametres}`);
}

const formulaire = document.querySelector<HTMLFormElement>('[data-filtres-itineraires]');
const resume = document.getElementById(formulaire?.dataset.filtresItineraires ?? '');
if (formulaire !== null && resume !== null) {
  const elements = [...document.querySelectorAll<HTMLElement>('li[data-itineraire]')];
  const communes = [...formulaire.querySelectorAll<HTMLOptionElement>('[name=commune] option')]
    .map((option) => option.value)
    .filter((valeur) => valeur !== '');
  remplir(formulaire, lireCriteres(new URLSearchParams(location.search), communes));
  formulaire.hidden = false;
  const relancer = () => {
    filtrer(formulaire, resume, elements, communes);
  };
  formulaire.addEventListener('change', relancer);
  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    relancer();
  });
  // L'événement reset précède la remise à zéro des champs : filtrer juste après.
  formulaire.addEventListener('reset', () => setTimeout(relancer, 0));
  relancer();
}
