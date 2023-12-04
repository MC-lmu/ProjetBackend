# Instructions

Lancement du serveur : `node .\app.js`

# API

Toutes les APIs sont accessibles à partir de `/api/v1/`.

APIs sans authentification:
* POST `/users`: créer un utilisateur
* GET `/auth/login`: s'authentifier
* GET `/auth/refreshToken`: rafraichir jeton d'accès par jeton refresh

APIs avec authentification (`Bearer ` access token dans header `Authorization`):
* GET `/users/me`: informations à propos de l'utilisateur
    * GET `/users/me/searches`: historique des recherches
* GET `/search/new`: nouvelle recherche
* GET `/search/existing`: relancer une recherche précédente


# Dépendances
* compression
* dotenv
* debug
* express
* http-errors
* jsonwebtoken
* mongoose
* morgan