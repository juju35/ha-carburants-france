# Changelog

## 0.9.2

### Changements
- Retrait des étiquettes de sous-enseigne (CONTACT, EXPRESS, MARKET, CITY) sur les logos et les repères. Le logo Total Access et l'enseigne écrite en toutes lettres restent.
- Captures d'écran du README mises à jour.

## 0.9.1

### Améliorations
- Les stations Total Access affichent leur propre logo, intégré à la carte (aucune requête externe), à la place du logo TotalEnergies et de l'étiquette ACCESS. L'étiquette reste pour les autres sous-enseignes (Contact, Express, Market, City).

## 0.9.0

### Nouveautés
- Les sous-enseignes se distinguent : TotalEnergies et Total Access partagent le même logo, une étiquette **ACCESS** est donc ajoutée sous le logo (carte liste) et à côté du nom (repères de la carte géographique). Même chose pour Contact, Express, Market et City (Intermarché Contact, Esso Express, Carrefour Market…).
- Carte liste : l'enseigne est écrite en toutes lettres avant l'adresse (option `show_brand`, activée par défaut).
- Carte géographique : l'enseigne s'affiche sous le nom dans la bulle de la station.

## 0.8.2

### Nouveautés
- Carte géographique : l'icône de l'intégration s'affiche à gauche du titre, comme sur la carte liste, et ouvre la page des données sur data.economie.gouv.fr (option `show_icon`, activée par défaut).

## 0.8.1

### Corrections
- Un carburant pouvait disparaître d'une station (cases et entités) quand le flux ne publiait plus ni prix ni rupture, par exemple juste après la levée d'une rupture, avant qu'un nouveau prix soit saisi. Un carburant qui a déjà eu ses entités reste désormais suivi : il s'affiche **Sans prix** (avec « rupture levée il y a… » quand le flux le précise), le prix est inconnu et la disponibilité aussi, jusqu'au prochain prix publié.
- Le détail brut des ruptures du flux est lu, pour repérer une rupture qui vient d'être levée (attribut `rupture_end`).

## 0.8.0

### Changements
- Retrait des noms par IA (Gemini ou autre entité `ai_task`) : le fichier communautaire de noms les rend inutiles. L'option et les noms obtenus par IA sont supprimés automatiquement de la configuration au démarrage.
- Ordre des noms : nom personnalisé, fichier communautaire, OpenStreetMap, enseigne et ville, adresse.

## 0.7.1

### Changements
- Le fichier communautaire devient aussi la source principale de l'enseigne ; OpenStreetMap ne sert plus que de repli, et pour le logo.

## 0.7.0

### Nouveautés
- Les stations prennent leur nom officiel depuis le fichier communautaire `stations_name.json` du projet [hass-prixcarburant](https://github.com/Aohzan/hass-prixcarburant) (environ 9 200 stations, mis à jour chaque semaine) : par exemple « Relais les Trois Marches » au lieu de « Route de Lorient Vezin-le-Coquet ». Les noms en majuscules sont mis en forme.
- Le fichier est téléchargé au plus une fois par semaine et gardé en cache : sans accès à GitHub, la copie en cache est utilisée.
- Ordre des noms : nom personnalisé, fichier communautaire, OpenStreetMap, IA, enseigne et ville, adresse. L'IA n'est plus interrogée pour les stations présentes dans le fichier.
- L'enseigne du fichier est utilisée quand OpenStreetMap n'en donne pas.

## 0.6.0

### Nouveautés
- Option **IA pour les noms manquants** : une entité IA de Home Assistant (Google Gemini ou autre, via `ai_task.generate_data`) est interrogée pour le nom des stations qu'OpenStreetMap ne connaît pas. Chaque station n'est demandée qu'une fois ; une réponse incertaine est ignorée et le nom automatique est conservé. Activer la recherche Google sur l'entité Gemini permet d'obtenir des noms vérifiés plutôt que devinés.
- Ordre des noms : nom personnalisé, puis OpenStreetMap, puis IA, puis enseigne et ville, puis adresse.

## 0.5.1

### Nouveautés
- Options : **Renommer les stations** pour donner votre propre nom à chaque station. Laissé vide, le nom automatique est conservé.

### Corrections
- Le nom et l'enseigne sont cherchés dans OpenStreetMap dans un rayon de 300 m au lieu de 120 m : les coordonnées du flux sont arrondies et parfois placées sur la rue. Les stations restées sans nom (affichées avec leur adresse) sont recherchées à nouveau une fois, au prochain démarrage.

## 0.5.0

### Nouveautés
- Les stations portent leur vrai nom, tiré d'OpenStreetMap (par exemple « TotalEnergies Access Rennes Saint-Malo »), sur les deux cartes, dans le formulaire de recherche et pour les appareils. Si OpenStreetMap n'a pas de nom, ou seulement « Station-service » ou le nom de l'enseigne, l'enseigne et la ville restent affichées.
- Carte géographique : le nom de la station s'affiche sur chaque repère, au-dessus du prix (option `show_name`, activée par défaut).
- Les stations déjà configurées récupèrent leur nom une fois, au prochain démarrage. Les identifiants d'entités ne changent pas.

## 0.4.3

### Améliorations
- Un clic en dehors d'une carte masque à nouveau les stations en rupture qui avaient été affichées, sur la carte liste comme sur la carte géographique.
- Le repli au clic extérieur se fait une fois le clic terminé : il ne décale plus la page sous le doigt quand plusieurs cartes sont empilées.

## 0.4.2

### Améliorations
- Carte liste : déplier une station replie les autres, et un clic en dehors de la carte replie tout. Un clic dans le détail déplié ne le referme plus.
- Carte géographique : la bulle d'une station se ferme au clic en dehors de la carte.

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
