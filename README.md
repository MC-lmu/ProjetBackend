# Instructions

Lancement du serveur : `node .\app.js`

**Attention:** le serveur s'attend à trouver les données DPE dans la collection `${COLLECTIONS_PREFIX}logements`!

# API

Toutes les APIs sont accessibles à partir de `/api/v1/`.

Documentation au format OpenAPI YAML: voir `api.yaml` (WIP)

# Dépendances
* compression
* dotenv
* debug
* express
* jsonwebtoken
* mongoose
* morgan