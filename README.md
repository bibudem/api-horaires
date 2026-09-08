# api-horaires

Service REST pour les heures d'ouverture des Bibliothèques de l'Université de Montréal

## Installation

Utiliser node v16.17.0

Dupliquer les fichiers de configuration suivants.

```Shell
config/local-environment.EXAMPLE.cjs
config/users.EXAMPLE.cjs
```

vers:

```Shell
config/local.cjs
config/users.cjs
```

Pour un développement en préproduction ou en production, il est préférable d'employer un suffixe approprié pour le fichier de configurations locales, par exemple:

```Shell
config/local-production.cjs
```

## Liste des codes de périodes

La liste peut être consultée en tout temps à l’adresse :

https://api.bib.umontreal.ca/horaires/periodes

## Liste des codes de services

La liste peut être consultée en tout temps à l’adresse :

https://api.bib.umontreal.ca/horaires/services

## Schéma JSON et documentation

https://api.bib.umontreal.ca/horaires/api-doc/

## Édition

https://bibudem.stoplight.io/docs/api-horaires
