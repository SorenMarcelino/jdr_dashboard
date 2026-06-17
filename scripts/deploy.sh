#!/usr/bin/env bash
# À lancer sur le VPS pour récupérer main et redémarrer la stack de prod.
#   ssh deploy@vps 'cd ~/JDR_Dashboard && ./scripts/deploy.sh'
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "erreur: .env manquant — copier .env.production.example vers .env et le renseigner" >&2
  exit 1
fi

git fetch --prune origin main
git pull --ff-only origin main

docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f >/dev/null

echo "✓ déployé $(git rev-parse --short HEAD)"
