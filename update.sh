#!/bin/bash
# ============================================================
# X-Pro Bego — Güncelleme Scripti
# Kullanım: bash update.sh
# ============================================================
set -e

APP_DIR="/opt/x-pro-bego"
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${CYAN}[*]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }

echo -e "${CYAN}X-Pro Bego güncelleniyor...${NC}"

cd "$APP_DIR"

# Mevcut commit hash'ini kaydet
OLD_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

info "GitHub'dan son sürüm çekiliyor..."
git pull origin main

NEW_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

if [ "$OLD_HASH" = "$NEW_HASH" ]; then
  warn "Zaten en güncel sürümdesiniz."
fi

# Ortam değişkenlerini yükle
if [ -f .env ]; then
  set -a; source .env; set +a
fi

info "Bağımlılıklar kontrol ediliyor..."
pnpm install --frozen-lockfile --silent

info "Veritabanı şeması güncelleniyor..."
pnpm --filter @workspace/db push

# Frontend: dist değiştiyse git'ten geldi, src değiştiyse derle
if [ ! -d "$APP_DIR/artifacts/marzban-analytics/dist/public" ]; then
  info "Frontend derleniyor (dist yok)..."
  pnpm --filter @workspace/marzban-analytics run build
elif [ -n "$OLD_HASH" ] && [ "$OLD_HASH" != "$NEW_HASH" ]; then
  SRC_CHANGED=$(git diff --name-only "$OLD_HASH" "$NEW_HASH" 2>/dev/null | grep -c "artifacts/marzban-analytics/src/" || true)
  DIST_CHANGED=$(git diff --name-only "$OLD_HASH" "$NEW_HASH" 2>/dev/null | grep -c "artifacts/marzban-analytics/dist/" || true)
  if [ "$DIST_CHANGED" -gt "0" ]; then
    success "Frontend dist git'ten alındı, derleme atlanıyor"
  elif [ "$SRC_CHANGED" -gt "0" ]; then
    info "Frontend kaynak kodu değişti, derleniyor..."
    pnpm --filter @workspace/marzban-analytics run build
  else
    success "Frontend değişmedi, derleme atlanıyor"
  fi
else
  success "Frontend güncelleme gerektirmiyor"
fi

# API server: her zaman hızlıca derle
info "API Server derleniyor..."
cd "$APP_DIR/artifacts/api-server"
pnpm run build
cd "$APP_DIR"

# update.sh'yi repodan güncelle
if [ -f "$APP_DIR/update.sh" ]; then
  cp "$APP_DIR/update.sh" "$APP_DIR/update.sh.bak" 2>/dev/null || true
fi

info "PM2 yeniden başlatılıyor..."
pm2 restart xprobego-api

echo ""
success "Güncelleme tamamlandı!"
echo -e "${CYAN}Sürüm:${NC} $(git log --oneline -1)"
echo -e "${CYAN}PM2 durumu:${NC}"
pm2 status xprobego-api
