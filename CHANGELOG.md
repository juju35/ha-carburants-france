# Changelog

## 0.4.1

### Améliorations
- Le lien **Itinéraire** devient un bouton plein, aux couleurs du thème, dans le détail d'une station et dans la bulle de la carte géographique.

## 0.4.0

### Nouveautés
- Carte géographique : choix du fond de carte (`map_style`), tous sans clé d'API : OpenStreetMap (via Home Assistant), OpenStreetMap France, Plan IGN, photos aériennes IGN, OpenTopoMap, CyclOSM, satellite Esri, ou vos propres tuiles (`tile_url`, `tile_attribution`).
- Le thème clair / sombre reste réglable séparément ; les photos aériennes ne sont jamais assombries.
- Changer de fond dans l'éditeur visuel met la carte à jour immédiatement, sans la recharger.

## 0.3.2

### Corrections
- Carte géographique : les logos larges (TotalEnergies, E.Leclerc…) débordaient des repères ; ils sont maintenant contenus, proportions conservées.
- Le logo actuel de l'enseigne est choisi quand Wikidata en garde plusieurs (l'ancien logo « TOTAL » s'affichait au lieu de TotalEnergies). Les logos des stations déjà configurées sont recherchés à nouveau une fois au démarrage.

## 0.3.1

### Corrections
- Carte géographique : le fond de carte affichait « API key required », CARTO exigeant désormais une clé. Il vient maintenant d'OpenStreetMap via le service de tuiles intégré à Home Assistant (2026.9 et plus), comme la carte native, sans clé ; directement depuis OpenStreetMap sur les versions plus anciennes. Le thème sombre assombrit le fond de carte.
- La carte géographique se redimensionne correctement après avoir été déplacée dans le tableau de bord.

## 0.3.0

### Nouveautés
- Les stations où tous les carburants suivis sont en rupture sont masquées sur les deux cartes. Un bouton **Afficher les stations en rupture** les fait réapparaître, et les masque à nouveau.
- Option `hide_out_of_stock_stations` (activée par défaut) dans l'éditeur visuel des deux cartes pour toujours tout afficher.
- Un clic sur l'icône de la carte ouvre la page des données sur data.economie.gouv.fr.

## 0.2.0

### Nouveautés
- Nouvelle carte `custom:carburants-france-map-card` : les stations suivies sur un plan, avec le logo de l'enseigne et le prix du carburant choisi sur chaque repère (vert pour le meilleur prix, orange en cas de rupture), le domicile, et au clic tous les prix, l'ouverture et l'itinéraire.
- Éditeur visuel de la carte géographique : carburant, hauteur, zoom, fond clair ou sombre, domicile, logos.
- Leaflet est fourni avec l'intégration : aucun CDN à charger.

### Corrections
- Une erreur inattendue pendant la recherche des stations affiche désormais un message dans le formulaire et la trace complète dans le journal, au lieu de « Erreur inconnue ».

## 0.1.0

Première version publique de l'intégration Carburants France pour Home Assistant, avec sa carte Lovelace.

### Intégration
- Prix et disponibilité des carburants depuis le flux instantané v2 de data.economie.gouv.fr, sans clé d'API, en une seule requête pour toutes les stations.
- Configuration depuis l'interface : choix des carburants (Gazole, SP95, SP98, E10, E85, GPLc), puis recherche des stations autour du domicile, par code postal, ville, département ou identifiant, avec les prix et la distance affichés dans la liste.
- Plusieurs recherches dans le même formulaire, la sélection est conservée.
- Options : carburants, stations suivies, ajout de stations, intervalle de mise à jour (15 minutes par défaut, 5 minimum).
- Capteurs **Prix** (€/L) et capteurs binaires **Disponible** par station et par carburant, avec le type et la date de début des ruptures.
- Capteur **Meilleur prix** par carburant parmi les stations suivies.
- Enseigne et logo de chaque station retrouvés via OpenStreetMap et Wikidata, recherche retentée au démarrage si elle a échoué.
- Action `carburants_france.refresh` pour forcer une mise à jour.
- Interface en français et en anglais.

### Carte `custom:carburants-france-card`
- Incluse dans l'intégration et ajoutée automatiquement aux ressources du tableau de bord : rien à installer à part.
- Logo de l'enseigne, nom, adresse, distance et ouverture en temps réel (ouvert, fermé, 24h/24, automate 24/24).
- Prix de chaque carburant avec leur ancienneté, ruptures en orange, meilleur prix en vert.
- Clic sur une station pour afficher ses horaires, ses services et un lien d'itinéraire.
- Tri par prix, distance, nom ou ordre de configuration, éditeur visuel complet.
- Compatible thème clair et sombre.

### Installation
- Via HACS (dépôt personnalisé, catégorie Intégration) ou en copiant `custom_components/carburants_france/`. L'archive `carburants_france.zip` est jointe à la release.
