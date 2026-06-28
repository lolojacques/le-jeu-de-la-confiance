# 🏛️ Socio-Prisoner Arena 2D

Une arène de simulation socio-économique en 2D basée sur le **Dilemme du Prisonnier Itéré (DPI)**. 

Ce projet fusionne les recherches de la théorie des jeux évolutionnaire (Modèles Individualistes vs Communautaires) avec les dynamiques de classes sociales, de mobilité asymétrique et de confiance dégradée par le bruit.

## 🔬 Origines Scientifiques & Concepts

Cette webapp est un laboratoire miniature inspiré de trois piliers majeurs :
1. **Jean-Paul Delahaye & Philippe Mathieu** : L'opposition entre le *Modèle Individualiste* (qui tend vers la coopération globale) et le *Modèle Communautaire* (où l'annulation des scores intra-famille fait émerger des attracteurs cycliques et maintient la diversité des comportements).
2. **Nicky Case (*The Evolution of Trust*)** : L'introduction du "Bruit" (malentendus communicationnels) et l'étude fine des dynamiques de confiance selon la répétition des interactions.
3. **Sociologie Économique** : La stratification de la population en 3 classes (Riches, Mixtes, Pauvres) définies par un **Coefficient de Gini**. Cette stratification dicte de manière asymétrique la capacité de mouvement (mobilité globale vs assignation à résidence) et l'exposition au bruit.

---

## 🎮 Fonctionnalités Clés

* **Grille Dynamique 2D** : Visualisation en temps réel des agents. La couleur de fond indique la classe sociale (Or, Bleu, Gris), tandis que le symbole/nuance indique la stratégie active.
* **Moteur d'Évolution Hybride** : Les agents peuvent soit migrer physiquement selon les droits de leur classe, soit changer de stratégie par mimétisme du succès ou pression normative.
* **Graphique Barycentrique** : Un polygone de phase dynamique qui suit le vecteur de population ($P_k$) pour repérer visuellement les états stables ou les attracteurs cycliques.
* **Presets de Laboratoire** : Scénarios pré-configurés chargeables en un clic (ex: *Gentrification prédatrice*, *Paix de Nicky Case*, *Chaos Cyclique*).

---

## 📁 Architecture du Projet

Le projet est structuré de manière strictement modulaire pour séparer la mécanique mathématique de l'interface graphique :

```text
├── .github/
│   └── workflows/
│       └── deploy.yml       # Déploiement automatisé sur GitHub Pages
├── core/
│   ├── economy.js           # Calcul du Gini et distribution des classes
│   ├── engine.js            # Moteur de match (DPI) et gestion du voisinage
│   └── strategies.js        # Catalogue des comportements (Copycat, Tricheur...)
├── display/
│   ├── arena.js             # Rendu Canvas 2D de la grille d'agents
│   └── charts.js            # Graphique barycentrique et courbes temporelles
├── ui/
│   └── controls.js          # Gestionnaires des sliders, boutons et presets
├── index.html               # Point d'entrée de l'application
└── README.md                # Vous êtes ici
