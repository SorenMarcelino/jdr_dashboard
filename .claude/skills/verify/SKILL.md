---
name: verify
description: Recette de vérification runtime du backend JDR Dashboard (Express + Socket.IO + Mongo)
---

# Vérifier ce projet en conditions réelles

## Lancer un backend jetable

Mongo tourne déjà via Docker (`jdr_dashboard-mongodb-1`, port 27017). Le backend
lit son env via `back/utils/loadEnvironment.mjs` (cherche `back/.env`, sinon
variables de process). Lancer une instance isolée :

```bash
NODE_ENV=development PORT=5062 \
MONGODB_URI="mongodb://localhost:27017/jdr_verify_$(date +%s)" \
TOKEN_KEY=verify-token-key-0123456789abcdef \
REFRESH_TOKEN_KEY=verify-refresh-key-0123456789abcdef \
node back/server.mjs
```

Pièges appris :
- **Pas les ports 5060/5061** : bloqués par la spec fetch (SIP) → `fetch failed: bad port` côté undici.
- **`127.0.0.1`, pas `localhost`** : le serveur écoute en IPv4 seulement, `fetch()` Node résout `localhost` en `::1`.
- Le port 5050 est occupé par le backend Docker ; 3000 par le frontend Docker.
- Healthcheck : `GET /health` → `{"status":"ok","db":"up"}`.
- Mot de passe signup : min 8 + majuscule + minuscule + chiffre (+ spécial), ex `Password-mj-1!`.

## Parcours E2E type (HTTP + Socket.IO)

1. `POST /auth/signup` `{email, username, password}` puis `POST /auth/login` → cookies `accessToken`/`refreshToken` dans Set-Cookie.
2. `POST /games/create` `{name, characterSheet}` (cookies MJ) → `game.inviteCode`, `game._id`.
3. `POST /games/join` `{inviteCode}` (cookies joueur).
4. Socket.IO : `io(BASE, { extraHeaders: { Cookie: cookies }, transports: ["websocket"] })` (socket.io-client est dans node_modules). Auth = cookie `accessToken`.
5. `emit("join-game", gameId)` → `joined-game` (+ `stage:update` si une scène est en cours).
6. **Enregistrer les listeners AVANT d'émettre** (sinon race sur la réponse).
7. Les erreurs serveur arrivent sur l'event `"error"` `{message}`.

Nettoyage : `docker exec jdr_dashboard-mongodb-1 mongosh --quiet --eval '...dropDatabase()'` sur les bases `jdr_verify_*`.

## Limites connues

- Pas d'outillage navigateur dans le repo (ni Playwright ni Puppeteer) : la
  vérification des composants React (widgets, popups) passe par `npm run build`
  + test manuel à deux onglets (MJ + joueur).
- Rate limiters en mémoire : redémarrer le serveur remet les compteurs à zéro
  (utile pour tester authLimiter/limiter global sans attendre 15 min).
