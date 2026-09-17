#!/usr/bin/env bash
# Deploy Next standalone to EC2 without wiping runtime uploads.
set -euo pipefail

PEM="${PEM:-/Users/meondev/Downloads/content.pem}"
HOST="${HOST:-ec2-user@52.66.204.66}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
npx prisma generate
npm run build

rm -rf .next/standalone/public .next/standalone/.next/static
cp -R public .next/standalone/public
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
mkdir -p .next/standalone/prisma
cp prisma/schema.prisma .next/standalone/prisma/schema.prisma

rm -rf /tmp/vidyora-deploy
mkdir -p /tmp/vidyora-deploy
cp -R .next/standalone/. /tmp/vidyora-deploy/
rm -f /tmp/vidyora-deploy/.env

# Never ship empty local upload placeholders over production media
rm -rf /tmp/vidyora-deploy/public/uploads

rsync -az \
  --exclude '.env' \
  --exclude 'node_modules/.cache' \
  --exclude 'public/uploads/' \
  -e "ssh -i $PEM -o StrictHostKeyChecking=no -o IdentitiesOnly=yes" \
  /tmp/vidyora-deploy/ "$HOST:/home/ec2-user/VIDYORA/app/"

ssh -i "$PEM" -o StrictHostKeyChecking=no -o IdentitiesOnly=yes "$HOST" \
  'cd /home/ec2-user/VIDYORA && pm2 startOrReload ecosystem.config.cjs --update-env'

rm -rf /tmp/vidyora-deploy
echo "DEPLOY_OK (uploads preserved)"
