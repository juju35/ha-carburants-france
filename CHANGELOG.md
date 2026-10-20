# Changelog

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
