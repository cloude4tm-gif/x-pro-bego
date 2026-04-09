#!/bin/bash
# ============================================================
# X-Pro Bego — Sunucu Kurulum Scripti
# Ubuntu 22.04 / Debian 12 için hazırlanmıştır
#
# Kurulum: bash install.sh
# ============================================================

set -e

# ─── Renkler ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "${BLUE}"
cat << 'EOF'
  ╔═══════════════════════════════════════╗
  ║         X-Pro Bego Installer          ║
  ║   Marzban Enterprise Management       ║
  ╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# ─── Root kontrolü ──────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Bu scripti root olarak çalıştırın: sudo bash install.sh"
fi

# ─── Değişkenler ────────────────────────────────────────────
APP_DIR="/opt/x-pro-bego"
APP_USER="xprobego"
API_PORT=8080
DB_NAME="xprobego"
DB_USER="xprobego"
DB_PASS=$(openssl rand -hex 16)
SESSION_SECRET=$(openssl rand -hex 32)

# ─── GitHub repo adresi (değiştirin!) ───────────────────────
GITHUB_REPO="${GITHUB_REPO:-https://github.com/YOUR_USERNAME/x-pro-bego.git}"

echo ""
warn "GitHub repo adresi: ${GITHUB_REPO}"
warn "Değiştirmek için: export GITHUB_REPO=https://github.com/kullanici/repo.git"
echo ""
read -p "Devam etmek için Enter'a basın (Ctrl+C iptal)..."

# ─── Sistem güncellemesi ─────────────────────────────────────
info "Sistem güncelleniyor..."
apt-get update -qq
apt-get install -y -qq curl wget gnupg2 software-properties-common \
  git nginx postgresql postgresql-contrib openssl lsof ufw
success "Sistem hazır"

# ─── Node.js 20 ─────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* && "$(node -v)" != v22* ]]; then
  info "Node.js 20 kuruluyor..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
  apt-get install -y -qq nodejs
  success "Node.js $(node -v) kuruldu"
else
  success "Node.js $(node -v) zaten kurulu"
fi

# ─── pnpm ────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  info "pnpm kuruluyor..."
  npm install -g pnpm@latest -q
  success "pnpm $(pnpm -v) kuruldu"
else
  success "pnpm $(pnpm -v) zaten kurulu"
fi

# ─── PM2 ─────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "PM2 kuruluyor..."
  npm install -g pm2 -q
  success "PM2 kuruldu"
else
  success "PM2 zaten kurulu"
fi

# ─── PostgreSQL ──────────────────────────────────────────────
info "PostgreSQL yapılandırılıyor..."
systemctl enable postgresql --quiet
systemctl start postgresql

# Veritabanı ve kullanıcı oluştur
sudo -u postgres psql -q << PSQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB_NAME}' WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = '${DB_NAME}'
)\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
PSQL
success "PostgreSQL veritabanı hazır: ${DB_NAME}"

# ─── Uygulama kullanıcısı ────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -d "$APP_DIR" -s /bin/bash "$APP_USER"
  success "Kullanıcı oluşturuldu: $APP_USER"
fi

# ─── Uygulamayı klonla ───────────────────────────────────────
info "Uygulama klonlanıyor..."
if [ -d "$APP_DIR/.git" ]; then
  warn "Mevcut kurulum bulundu, güncelleniyor..."
  cd "$APP_DIR" && git pull origin main 2>/dev/null || git pull origin master
elif [ -d "$APP_DIR" ]; then
  warn "Yarım kalmış kurulum dizini temizleniyor..."
  rm -rf "$APP_DIR"
  git clone "$GITHUB_REPO" "$APP_DIR"
  success "Uygulama klonlandı: $APP_DIR"
else
  git clone "$GITHUB_REPO" "$APP_DIR"
  success "Uygulama klonlandı: $APP_DIR"
fi

# ─── Environment dosyası ─────────────────────────────────────
info ".env dosyası oluşturuluyor..."
cat > "$APP_DIR/.env" << ENV
# X-Pro Bego — Ortam Değişkenleri
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
ENV

# DB paketi için de .env
mkdir -p "$APP_DIR/lib/db"
cp "$APP_DIR/.env" "$APP_DIR/lib/db/.env"

success ".env dosyası oluşturuldu"

# ─── Bağımlılıkları yükle ─────────────────────────────────────
info "Bağımlılıklar yükleniyor (bu biraz sürebilir)..."
cd "$APP_DIR"
pnpm install --frozen-lockfile 2>&1 | tail -5
success "Bağımlılıklar yüklendi"

# ─── Veritabanı tablolarını oluştur ───────────────────────────
info "Veritabanı şeması oluşturuluyor..."
cd "$APP_DIR"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
pnpm --filter @workspace/db push 2>&1 | tail -5
success "Veritabanı tabloları hazır"

# ─── Frontend build ───────────────────────────────────────────
info "Frontend derleniyor..."
cd "$APP_DIR"
pnpm --filter @workspace/marzban-analytics run build 2>&1 | tail -5
success "Frontend derlendi"

# ─── API Server build ─────────────────────────────────────────
info "API Server derleniyor..."
cd "$APP_DIR/artifacts/api-server"
pnpm run build 2>&1 | tail -5
success "API Server derlendi"

# ─── PM2 ecosystem ────────────────────────────────────────────
info "PM2 yapılandırması oluşturuluyor..."
cat > "$APP_DIR/ecosystem.config.cjs" << ECOSYSTEM
module.exports = {
  apps: [{
    name: 'xprobego-api',
    script: './artifacts/api-server/dist/index.mjs',
    cwd: '${APP_DIR}',
    interpreter: 'node',
    interpreter_args: '--enable-source-maps',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: '${API_PORT}',
      DATABASE_URL: 'postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}',
      SESSION_SECRET: '${SESSION_SECRET}',
    },
  }],
};
ECOSYSTEM

# PM2'yi başlat
pm2 delete xprobego-api 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
success "PM2 API server çalışıyor"

# ─── Nginx yapılandırması ─────────────────────────────────────
info "Nginx yapılandırılıyor..."

# Domain/IP sor
echo ""
read -p "Sunucu domain veya IP adresi (örn: mypanel.com veya 1.2.3.4): " SERVER_DOMAIN
SERVER_DOMAIN="${SERVER_DOMAIN:-_}"

cat > "/etc/nginx/sites-available/xprobego" << NGINX
server {
    listen 80;
    server_name ${SERVER_DOMAIN};

    # Frontend static dosyalar
    root ${APP_DIR}/artifacts/marzban-analytics/dist;
    index index.html;

    # Enterprise API → API Server (port ${API_PORT})
    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Frontend SPA — tüm rotaları index.html'e yönlendir
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Güvenlik başlıkları
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
NGINX

ln -sf /etc/nginx/sites-available/xprobego /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx
success "Nginx yapılandırıldı"

# ─── Güvenlik Duvarı ──────────────────────────────────────────
info "UFW güvenlik duvarı yapılandırılıyor..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny "${API_PORT}/tcp" 2>/dev/null || true   # API portu dışarıya kapalı
success "Güvenlik duvarı yapılandırıldı"

# ─── SSL (opsiyonel) ──────────────────────────────────────────
if [[ "$SERVER_DOMAIN" != "_" && "$SERVER_DOMAIN" == *.* ]]; then
  echo ""
  read -p "SSL sertifikası kurunsun mu? (Let's Encrypt) [e/H]: " INSTALL_SSL
  if [[ "$INSTALL_SSL" =~ ^[Ee]$ ]]; then
    apt-get install -y -qq certbot python3-certbot-nginx
    certbot --nginx -d "$SERVER_DOMAIN" --non-interactive --agree-tos -m "admin@${SERVER_DOMAIN}" || \
      warn "SSL kurulumu başarısız, HTTP ile devam ediliyor"
    success "SSL sertifikası kuruldu"
  fi
fi

# ─── Bilgileri kaydet ─────────────────────────────────────────
cat > "$APP_DIR/install-info.txt" << INFO
X-Pro Bego Kurulum Bilgileri
============================
Kurulum Tarihi : $(date)
Uygulama Dizini: ${APP_DIR}
API Port       : ${API_PORT}
Domain         : ${SERVER_DOMAIN}

PostgreSQL:
  Veritabanı   : ${DB_NAME}
  Kullanıcı    : ${DB_USER}
  Şifre        : ${DB_PASS}
  URL          : postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

Session Secret : ${SESSION_SECRET}

Komutlar:
  pm2 status          → API server durumu
  pm2 logs xprobego-api → API logları
  pm2 restart xprobego-api → API yeniden başlat
  bash ${APP_DIR}/update.sh → Güncelleme
INFO

chmod 600 "$APP_DIR/install-info.txt"

# ─── Güncelleme scripti ────────────────────────────────────────
cat > "$APP_DIR/update.sh" << 'UPDATE'
#!/bin/bash
set -e
APP_DIR="/opt/x-pro-bego"
echo "🔄 X-Pro Bego güncelleniyor..."

cd "$APP_DIR"
git pull origin main 2>/dev/null || git pull origin master

export $(cat .env | grep -v '^#' | xargs)
pnpm install --frozen-lockfile
pnpm --filter @workspace/db push
pnpm --filter @workspace/marzban-analytics run build
cd artifacts/api-server && pnpm run build && cd "$APP_DIR"

pm2 restart xprobego-api
echo "✅ Güncelleme tamamlandı!"
UPDATE
chmod +x "$APP_DIR/update.sh"

# ─── Tamamlandı ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}"
cat << 'EOF'
  ╔═══════════════════════════════════════╗
  ║       Kurulum Tamamlandı! 🎉          ║
  ╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Panel adresi:${NC}  http://${SERVER_DOMAIN}"
echo -e "${CYAN}API Sağlık:${NC}    http://localhost:${API_PORT}/api/healthz"
echo -e "${CYAN}Kurulum Bilgileri:${NC} cat ${APP_DIR}/install-info.txt"
echo ""
echo -e "${YELLOW}Not:${NC} Kurulum bilgileri (DB şifresi vb.) şurada:"
echo "     ${APP_DIR}/install-info.txt"
echo ""
echo -e "${CYAN}Güncelleme:${NC}    bash ${APP_DIR}/update.sh"
echo ""
