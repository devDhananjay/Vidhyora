#!/usr/bin/env bash
# Deploy Next standalone to EC2 without wiping runtime uploads.
set -euo pipefail

PEM="${PEM:-/Users/meondev/Downloads/content.pem}"
HOST="${HOST:-ec2-user@52.66.204.66}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -i "$PEM" -o StrictHostKeyChecking=no -o IdentitiesOnly=yes)

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
# Mac build artifacts must not land on linux EC2 (wastes disk / breaks engines)
rm -f /tmp/vidyora-deploy/node_modules/.prisma/client/libquery_engine-darwin* 2>/dev/null || true
rm -rf /tmp/vidyora-deploy/node_modules/@img/sharp-darwin-* \
       /tmp/vidyora-deploy/node_modules/@img/sharp-libvips-darwin-* 2>/dev/null || true

# Free disk BEFORE rsync — ENOSPC breaks deploys and CMS uploads
"${SSH[@]}" "$HOST" bash <<'REMOTE'
set -e
rm -rf /home/ec2-user/.npm/_cacache /home/ec2-user/.npm/_logs /home/ec2-user/.npm/_npx 2>/dev/null || true
rm -rf /home/ec2-user/.cache /tmp/vidyora-deploy /tmp/npm-* /tmp/v8-* 2>/dev/null || true
pm2 flush 2>/dev/null || true
# Drop Mac-only / wasm sharp stubs that waste space and break require()
rm -rf /home/ec2-user/VIDYORA/app/node_modules/@img/sharp-darwin-* \
       /home/ec2-user/VIDYORA/app/node_modules/@img/sharp-libvips-darwin-* \
       /home/ec2-user/VIDYORA/app/node_modules/@img/sharp-wasm32 \
       /home/ec2-user/VIDYORA/app/node_modules/.prisma/client/libquery_engine-darwin* \
       2>/dev/null || true
df -h /
REMOTE

rsync -az \
  --exclude '.env' \
  --exclude 'node_modules/.cache' \
  --exclude 'public/uploads/' \
  --exclude 'node_modules/@img/sharp-darwin-*' \
  --exclude 'node_modules/@img/sharp-libvips-darwin-*' \
  --exclude 'node_modules/@img/sharp-wasm32' \
  --exclude 'node_modules/.prisma/client/libquery_engine-darwin*' \
  --exclude 'node_modules/@prisma/engines/*darwin*' \
  -e "ssh -i $PEM -o StrictHostKeyChecking=no -o IdentitiesOnly=yes" \
  /tmp/vidyora-deploy/ "$HOST:/home/ec2-user/VIDYORA/app/"

"${SSH[@]}" "$HOST" bash <<'REMOTE'
set -e
mkdir -p /home/ec2-user/VIDYORA/app/.next/cache/images \
         /home/ec2-user/VIDYORA/app/public/uploads/homepage
# Install sharp in an empty scratch dir (avoids full-tree npm ENOSPC), then copy in
rm -rf /tmp/sharp-install
mkdir -p /tmp/sharp-install
printf '%s\n' '{"name":"sharp-scratch","private":true}' > /tmp/sharp-install/package.json
(cd /tmp/sharp-install && npm install --os=linux --cpu=x64 --include=optional sharp@0.35.4) || true
if [ -d /tmp/sharp-install/node_modules/sharp ]; then
  mkdir -p /home/ec2-user/VIDYORA/app/node_modules
  rm -rf /home/ec2-user/VIDYORA/app/node_modules/sharp \
         /home/ec2-user/VIDYORA/app/node_modules/@img
  cp -a /tmp/sharp-install/node_modules/sharp /home/ec2-user/VIDYORA/app/node_modules/
  cp -a /tmp/sharp-install/node_modules/@img /home/ec2-user/VIDYORA/app/node_modules/
fi
rm -rf /tmp/sharp-install /home/ec2-user/.npm/_cacache
node -e 'try{require("sharp");console.log("sharp_ok")}catch(e){console.log("sharp_fail",e.message)}' \
  || true
cd /home/ec2-user/VIDYORA
pm2 startOrReload ecosystem.config.cjs --update-env
df -h /
REMOTE

rm -rf /tmp/vidyora-deploy
echo "DEPLOY_OK (uploads preserved)"
