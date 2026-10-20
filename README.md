# ha-carburants-france

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HACS Validation](https://github.com/juju35/ha-carburants-france/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-carburants-france/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-carburants-france/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-carburants-france/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-carburants-france)](https://github.com/juju35/ha-carburants-france/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Intégration Home Assistant pour les [prix des carburants en France](https://data.economie.gouv.fr/explore/assets/prix-des-carburants-en-france-flux-instantane-v2/view/) : suivez les prix et la disponibilité des carburants dans vos stations, avec une carte Lovelace incluse qui affiche les logos des enseignes.

<img src="https://raw.githubusercontent.com/juju35/ha-carburants-france/main/screenshots/carburants-france-card-0.3.0.png" alt="carburants-france-card" width="380"> <img src="https://raw.githubusercontent.com/juju35/ha-carburants-france/main/screenshots/carburants-france-card-dark-0.3.0.png" alt="carburants-france-card, thème sombre, station dépliée" width="380">

## Fonctionnalités

- Données officielles du flux instantané de l'État, **sans clé d'API**, en une seule requête pour toutes vos stations
- **Recherche des stations dans le formulaire de configuration** : autour du domicile (rayon réglable), par code postal, ville, département ou identifiant de station, avec les prix affichés pour faire votre choix
- Choix des **carburants à suivre** : Gazole, SP95, SP98, E10, E85, GPLc
- Par station et par carburant : un capteur **Prix** (€/L, avec historique) et un capteur binaire **Disponible** (rupture temporaire ou définitive, avec la date de début)
- Par carburant : un capteur **Meilleur prix** parmi vos stations, avec la station en attributs
- **Enseigne et logo** de chaque station, retrouvés automatiquement via OpenStreetMap et Wikidata
- Action `carburants_france.refresh` pour forcer une mise à jour
- Carte `custom:carburants-france-card` **incluse dans l'intégration** et chargée automatiquement : logos, prix, rupture, meilleur prix en vert, ouverture en temps réel, horaires, services et itinéraire au clic
- Carte géographique `custom:carburants-france-map-card` : vos stations sur un plan, avec le logo et le prix d'un carburant sur chaque repère, le domicile, et le détail de la station au clic
- Ajout ou retrait de stations et de carburants à tout moment depuis les options
- Français / anglais

## Prérequis

- Aucun compte ni clé d'API : les données sont publiques ([data.economie.gouv.fr](https://data.economie.gouv.fr/explore/assets/prix-des-carburants-en-france-flux-instantane-v2/view/))
- La position du domicile renseignée dans Home Assistant, pour la recherche autour de chez vous et les distances

## Installation via HACS (recommandé)

[![Ajouter à HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-carburants-france&category=integration)

Ou manuellement :

1. Ouvrir HACS → ⋮ → **Dépôts personnalisés**
2. Ajouter `https://github.com/juju35/ha-carburants-france` — Catégorie : **Intégration**
3. Rechercher **Carburants France** et l'installer
4. Redémarrer Home Assistant

La carte est **incluse dans l'intégration** : au démarrage, elle est ajoutée automatiquement aux ressources du tableau de bord (`/carburants_france_static/carburants-france-card.js`, type module). Après une installation ou une mise à jour, redémarrez Home Assistant puis rafraîchissez le navigateur (vider le cache de l'application mobile si besoin).

Si vos tableaux de bord sont en mode YAML, la carte est chargée sur toutes les pages sans passer par les ressources.

## Installation manuelle

Copiez le dossier `custom_components/carburants_france/` dans `/config/custom_components/carburants_france/`, puis redémarrez Home Assistant.

## Configuration

[![Ajouter l'intégration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=carburants_france)

**Paramètres → Appareils et services → Ajouter une intégration → Carburants France**, puis :

1. **Nom et carburants** : donnez un nom (« Carburants », « Travail »…) et cochez les carburants à suivre.
2. **Recherche** : laissez vide pour chercher autour du domicile dans le rayon choisi, ou saisissez un code postal (`35000`), une ville (`Rennes`), un département (`35`) ou l'identifiant d'une station (`35000013`).
3. **Stations** : cochez les stations à suivre. Chaque ligne affiche l'enseigne, l'adresse, les prix des carburants choisis (✕ en cas de rupture) et la distance. Cochez **Nouvelle recherche** pour ajouter des stations ailleurs : la sélection est conservée.

Options (bouton **Configurer**) :

| Option | Défaut | Description |
|---|---|---|
| Carburants à suivre | Gazole | Carburants pour lesquels les capteurs sont créés |
| Stations suivies | — | Décochez une station pour ne plus la suivre |
| Ajouter des stations | — | Relance la recherche pour ajouter des stations |
| Intervalle de mise à jour | 15 min | Minimum 5 min : le flux de l'État est mis à jour toutes les 10 minutes |

Plusieurs entrées sont possibles, par exemple une autour de la maison et une sur le trajet du travail.

## Entités

Chaque station est un appareil, nommé d'après son enseigne et sa ville (renommable dans Home Assistant).

| Entité | Exemple | Description |
|---|---|---|
| Prix | `sensor.leclerc_rennes_gazole` | Prix en €/L. Inconnu pendant une rupture. Attributs : date de mise à jour, rupture, adresse, distance |
| Disponible | `binary_sensor.leclerc_rennes_gazole_disponible` | Allumé quand le carburant est disponible. Attributs : type de rupture (`temporaire`, `definitive`) et date de début |
| Meilleur prix | `sensor.carburants_meilleur_prix_gazole` | Prix le plus bas parmi les stations où le carburant est disponible, avec la station en attributs |
| Stations | `sensor.carburants_stations` | Nombre de stations suivies, toutes les données en attributs (utilisé par la carte) |

Un carburant en rupture définitive (plus vendu) n'a pas d'entité. Un carburant qui n'est pas suivi non plus.

## Carte

Ajoutez la carte **Carburants France** depuis le sélecteur de cartes : toutes les options se règlent dans l'éditeur visuel. En YAML :

```yaml
type: custom:carburants-france-card
```

| Option | Défaut | Description |
|---|---|---|
| `entity` | détectée | Capteur Stations à afficher (utile avec plusieurs entrées) |
| `title` | « Carburants » | Titre de la carte |
| `fuels` | tous | Carburants affichés, par exemple `[gazole, e10]` |
| `sort` | `price` | `price`, `distance`, `name` ou `config` (ordre de configuration) |
| `sort_fuel` | 1er carburant | Carburant utilisé pour le tri par prix |
| `max_stations` | `0` | Nombre maximum de stations affichées (`0` = toutes) |
| `show_icon` | `true` | Icône à côté du titre, qui ouvre la page des données sur data.economie.gouv.fr |
| `show_logo` | `true` | Logo de l'enseigne (initiales en couleur si aucun logo n'est connu) |
| `show_address` | `true` | Adresse et ville |
| `show_distance` | `true` | Distance depuis le domicile |
| `show_hours` | `true` | Ouvert, fermé, 24h/24 ou automate 24/24, avec l'heure de fermeture ou d'ouverture |
| `show_updated` | `true` | Ancienneté de chaque prix |
| `show_out_of_stock` | `true` | Afficher les carburants en rupture temporaire |
| `highlight_best` | `true` | Meilleur prix de chaque carburant en vert avec une étoile |
| `show_refresh` | `true` | Bouton d'actualisation |
| `hide_out_of_stock_stations` | `true` | Masquer les stations où tous les carburants affichés sont en rupture |

Cliquez sur une station pour voir ses horaires de la semaine, ses services et un lien d'itinéraire.

Les stations où **tous les carburants affichés sont en rupture** sont masquées : le bouton **Afficher les stations en rupture**, en bas de la carte, les fait réapparaître.

## Carte géographique

Ajoutez la carte **Carburants France — carte** depuis le sélecteur de cartes. En YAML :

```yaml
type: custom:carburants-france-map-card
fuel: gazole
```

| Option | Défaut | Description |
|---|---|---|
| `entity` | détectée | Capteur Stations à afficher (utile avec plusieurs entrées) |
| `title` | « Carte des stations » | Titre de la carte, `""` pour le masquer |
| `fuel` | 1er carburant | Carburant dont le prix est affiché sur les repères |
| `height` | `400` | Hauteur de la carte en pixels |
| `zoom` | ajusté | Zoom fixe ; par défaut, la carte s'ajuste pour montrer toutes les stations |
| `theme` | `auto` | Fond de carte `auto` (selon le thème de Home Assistant), `light` ou `dark` |
| `show_home` | `true` | Afficher le domicile |
| `show_logo` | `true` | Logo de l'enseigne sur les repères |
| `hide_out_of_stock_stations` | `true` | Masquer les stations où tous les carburants suivis sont en rupture (bouton en haut à droite pour les afficher) |

Chaque repère affiche le logo et le prix : vert pour le meilleur prix, orange en cas de rupture. Cliquez sur un repère pour voir tous les prix, l'ouverture et l'itinéraire. Le zoom à la molette est désactivé pour ne pas gêner le défilement du tableau de bord (utilisez les boutons ou le pincement).

La carte utilise [Leaflet](https://leafletjs.com), fourni avec l'intégration, et les fonds de carte CARTO / OpenStreetMap, comme la carte native de Home Assistant.

## Automatisations

Être prévenu quand le gazole passe sous 2 € dans une de vos stations :

```yaml
triggers:
  - trigger: numeric_state
    entity_id: sensor.carburants_meilleur_prix_gazole
    below: 2
actions:
  - action: notify.mobile_app_telephone
    data:
      title: Gazole à {{ states('sensor.carburants_meilleur_prix_gazole') }} €
      message: "{{ state_attr('sensor.carburants_meilleur_prix_gazole', 'station_name') }}"
```

Être prévenu d'une rupture :

```yaml
triggers:
  - trigger: state
    entity_id: binary_sensor.leclerc_rennes_gazole_disponible
    to: "off"
actions:
  - action: notify.mobile_app_telephone
    data:
      message: Rupture de gazole chez Leclerc Rennes
```

## Enseignes et logos

Le flux de l'État ne donne pas l'enseigne des stations. L'intégration la retrouve dans [OpenStreetMap](https://www.openstreetmap.org) (tag `ref:FR:prix-carburants`, sinon la station la plus proche à moins de 120 m), puis le logo de l'enseigne sur [Wikidata](https://www.wikidata.org) / Wikimedia Commons. La recherche est faite une fois, à l'ajout de la station ; si OpenStreetMap est injoignable, elle est retentée au démarrage suivant. Sans enseigne connue, la carte affiche une icône de station.

## Données

- Prix et stations : Ministère de l'Économie, [flux instantané v2](https://data.economie.gouv.fr/explore/assets/prix-des-carburants-en-france-flux-instantane-v2/view/), Licence Ouverte
- Enseignes : © contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL
- Logos : Wikimedia Commons, via Wikidata
- Fonds de carte : © contributeurs OpenStreetMap, © CARTO

## Licence

MIT
