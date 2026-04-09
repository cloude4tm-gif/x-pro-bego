#!/bin/bash
# ============================================================
# X-Pro Bego — Bağımsız VPN Panel Kurulum Scripti
# Ubuntu 22.04 / Debian 12 için hazırlanmıştır
# Marzban GEREKTIRMEZ — tamamen bağımsız çalışır
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
  ║   Bağımsız VPN Panel (Marzban Yok)    ║
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
XRAY_CONFIG_PATH="/etc/x-pro-bego/xray.json"

# ─── GitHub repo adresi ─────────────────────────────────────
GITHUB_REPO="${GITHUB_REPO:-https://github.com/cloude4tm-gif/x-pro-bego.git}"

echo ""
warn "GitHub repo adresi: ${GITHUB_REPO}"
warn "Değiştirmek için: export GITHUB_REPO=https://github.com/kullanici/repo.git"
echo ""
read -p "Devam etmek için Enter'a basın (Ctrl+C iptal)..."

# ─── Sunucu IP ───────────────────────────────────────────────
SERVER_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || curl -s --connect-timeout 5 api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
info "Sunucu IP: ${SERVER_IP}"

# ─── Sistem güncellemesi ─────────────────────────────────────
info "Sistem güncelleniyor..."
apt-get update -qq
apt-get install -y -qq curl wget gnupg2 software-properties-common \
  git nginx postgresql postgresql-contrib openssl lsof ufw unzip
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

# ─── Xray Core ───────────────────────────────────────────────
info "Xray core kuruluyor..."
XRAY_VERSION=$(curl -s https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep '"tag_name"' | cut -d'"' -f4 || echo "v25.3.6")
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then XRAY_ARCH="64"; elif [ "$ARCH" = "aarch64" ]; then XRAY_ARCH="arm64-v8a"; else XRAY_ARCH="64"; fi

mkdir -p /tmp/xray-install
XRAY_URL="https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-${XRAY_ARCH}.zip"
wget -q -O /tmp/xray-install/xray.zip "$XRAY_URL" || {
  warn "GitHub'dan indirilemedi, v25.3.6 deneniyor..."
  XRAY_VERSION="v25.3.6"
  wget -q -O /tmp/xray-install/xray.zip "https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-${XRAY_ARCH}.zip"
}
cd /tmp/xray-install && unzip -o -q xray.zip && mv xray /usr/local/bin/xray && chmod +x /usr/local/bin/xray
cp geoip.dat geosite.dat /usr/local/bin/ 2>/dev/null || true
rm -rf /tmp/xray-install
success "Xray $(xray version 2>/dev/null | head -1 || echo ${XRAY_VERSION}) kuruldu"

# ─── x25519 anahtar üret ─────────────────────────────────────
info "x25519 anahtar çifti oluşturuluyor..."
KEY_OUTPUT=$(xray x25519 2>/dev/null || echo "")
PRIVATE_KEY=$(echo "$KEY_OUTPUT" | grep -i "private" | awk '{print $NF}' || openssl rand -hex 32)
PUBLIC_KEY=$(echo "$KEY_OUTPUT" | grep -i "public" | awk '{print $NF}' || echo "")
if [ -z "$PUBLIC_KEY" ]; then
  warn "Anahtar üretimi başarısız, varsayılan kullanılıyor"
  PRIVATE_KEY="wKuxJATmS13Y3U7fAhlQoi78LURfEWopZqlPwAIfrm4"
  PUBLIC_KEY="Hw2UKrhkQ8oV16G-VZ9sey2G8l5i7g6-93_wbLmvKSA"
fi
success "x25519 anahtar çifti hazır"

# ─── Xray config dizini ──────────────────────────────────────
mkdir -p /etc/x-pro-bego

cat > "${XRAY_CONFIG_PATH}" << XRAYCONF
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "tag": "VLESS TCP REALITY",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "dl.google.com:443",
          "xver": 0,
          "serverNames": ["dl.google.com", "www.google.com"],
          "privateKey": "${PRIVATE_KEY}",
          "publicKey": "${PUBLIC_KEY}",
          "shortIds": ["", "6ba85179", "2375e55a"],
          "fingerprint": "chrome"
        }
      },
      "sniffing": { "enabled": true, "destOverride": ["http", "tls"] }
    },
    {
      "tag": "Shadowsocks TCP",
      "port": 1080,
      "protocol": "shadowsocks",
      "settings": {
        "clients": [],
        "method": "chacha20-ietf-poly1305",
        "network": "tcp,udp"
      }
    }
  ],
  "outbounds": [
    { "tag": "direct", "protocol": "freedom" },
    { "tag": "block", "protocol": "blackhole" }
  ],
  "routing": {
    "rules": [
      { "type": "field", "ip": ["geoip:private"], "outboundTag": "block" },
      { "type": "field", "domain": ["geosite:category-ads"], "outboundTag": "block" }
    ]
  }
}
XRAYCONF

success "Xray konfigürasyonu oluşturuldu: ${XRAY_CONFIG_PATH}"

# ─── PostgreSQL ──────────────────────────────────────────────
info "PostgreSQL yapılandırılıyor..."
systemctl enable postgresql --quiet
systemctl start postgresql

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
SERVER_IP=${SERVER_IP}
XRAY_CONFIG_PATH=${XRAY_CONFIG_PATH}
XRAY_BINARY=/usr/local/bin/xray
ENV

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
if [ -d "$APP_DIR/artifacts/marzban-analytics/dist/public" ]; then
  success "Frontend önceden derlenmiş (dist mevcut), derleme atlanıyor"
else
  info "Frontend derleniyor..."
  cd "$APP_DIR"
  pnpm --filter @workspace/marzban-analytics run build 2>&1 | tail -5
  success "Frontend derlendi"
fi

# ─── API Server build ─────────────────────────────────────────
info "API Server derleniyor..."
cd "$APP_DIR/artifacts/api-server"
pnpm run build 2>&1 | tail -5
success "API Server derlendi"

# ─── PM2 ecosystem ────────────────────────────────────────────
info "PM2 yapılandırması oluşturuluyor..."
cat > "$APP_DIR/ecosystem.config.cjs" << ECOSYSTEM
module.exports = {
  apps: [
    {
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
        SERVER_IP: '${SERVER_IP}',
        XRAY_CONFIG_PATH: '${XRAY_CONFIG_PATH}',
        XRAY_BINARY: '/usr/local/bin/xray',
      },
    },
    {
      name: 'xprobego-xray',
      script: '/usr/local/bin/xray',
      args: 'run -c ${XRAY_CONFIG_PATH}',
      interpreter: 'none',
      autorestart: true,
      watch: false,
    }
  ],
};
ECOSYSTEM

# PM2'yi başlat
pm2 delete xprobego-api 2>/dev/null || true
pm2 delete xprobego-xray 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
success "PM2 API server ve Xray çalışıyor"

# ─── Nginx yapılandırması ─────────────────────────────────────
info "Nginx yapılandırılıyor..."

echo ""
read -p "Sunucu domain veya IP adresi (örn: mypanel.com veya 1.2.3.4) [${SERVER_IP}]: " SERVER_DOMAIN
SERVER_DOMAIN="${SERVER_DOMAIN:-${SERVER_IP}}"

cat > "/etc/nginx/sites-available/xprobego" << NGINX
server {
    listen 80;
    server_name ${SERVER_DOMAIN};

    # Frontend static dosyalar (Vite outDir: dist/public)
    root ${APP_DIR}/artifacts/marzban-analytics/dist/public;
    index index.html;

    # X-Pro Bego API → API Server (port ${API_PORT})
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
ufw allow 1080/tcp
ufw allow 1080/udp
ufw deny "${API_PORT}/tcp" 2>/dev/null || true
success "Güvenlik duvarı yapılandırıldı"

# ─── SSL (opsiyonel) ──────────────────────────────────────────
if [[ "$SERVER_DOMAIN" =~ \. ]] && ! [[ "$SERVER_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
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
Kurulum Tarihi  : $(date)
Uygulama Dizini : ${APP_DIR}
API Port        : ${API_PORT}
Domain          : ${SERVER_DOMAIN}
Sunucu IP       : ${SERVER_IP}

PostgreSQL:
  Veritabanı    : ${DB_NAME}
  Kullanıcı     : ${DB_USER}
  Şifre         : ${DB_PASS}
  URL           : postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

Session Secret  : ${SESSION_SECRET}

Xray:
  Config        : ${XRAY_CONFIG_PATH}
  VLESS Port    : 443 (Reality)
  SS Port       : 1080 (Shadowsocks)
  Private Key   : ${PRIVATE_KEY}
  Public Key    : ${PUBLIC_KEY}

İlk Giriş (panel ilk açıldığında oluşturulur):
  Kullanıcı Adı : admin
  Şifre         : Kendi belirlediğiniz şifre (ilk girişte)

Komutlar:
  pm2 status                  → Tüm servisler
  pm2 logs xprobego-api       → API logları
  pm2 logs xprobego-xray      → Xray logları
  pm2 restart xprobego-api    → API yeniden başlat
  pm2 restart xprobego-xray   → Xray yeniden başlat
  bash ${APP_DIR}/update.sh   → Güncelleme
INFO

chmod 600 "$APP_DIR/install-info.txt"

# ─── Güncelleme scripti ────────────────────────────────────────
cat > "$APP_DIR/update.sh" << 'UPDATE'
#!/bin/bash
set -e
APP_DIR="/opt/x-pro-bego"
echo "[*] X-Pro Bego güncelleniyor..."

cd "$APP_DIR"

OLD_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
git pull origin main 2>/dev/null || git pull origin master
NEW_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

export $(cat .env | grep -v '^#' | xargs)

pnpm install --frozen-lockfile --silent
pnpm --filter @workspace/db push

# Frontend: kaynak değiştiyse veya dist yoksa build et
if [ ! -d "$APP_DIR/artifacts/marzban-analytics/dist/public" ]; then
  echo "[*] Frontend derleniyor..."
  pnpm --filter @workspace/marzban-analytics run build
elif [ -n "$OLD_HASH" ] && [ "$OLD_HASH" != "$NEW_HASH" ]; then
  if git diff --name-only "$OLD_HASH" "$NEW_HASH" | grep -q "artifacts/marzban-analytics/src/"; then
    echo "[*] Frontend kaynak kodu değişti, derleniyor..."
    pnpm --filter @workspace/marzban-analytics run build
  else
    echo "[✓] Frontend değişmedi, derleme atlanıyor"
  fi
fi

# API server her zaman derlenir
cd artifacts/api-server && pnpm run build && cd "$APP_DIR"

pm2 restart xprobego-api
echo "[✓] Güncelleme tamamlandı!"
UPDATE
chmod +x "$APP_DIR/update.sh"

# ─── Tamamlandı ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}"
cat << 'EOF'
  ╔═══════════════════════════════════════╗
  ║       Kurulum Tamamlandı!             ║
  ╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Panel adresi:${NC}    http://${SERVER_DOMAIN}"
echo -e "${CYAN}API Sağlık:${NC}      http://localhost:${API_PORT}/api/healthz"
echo -e "${CYAN}Xray Durum:${NC}      pm2 status"
echo ""
echo -e "${YELLOW}İlk giriş:${NC} Panel açıldığında 'admin' kullanıcısı + şifreniyle giriş yapın"
echo -e "${YELLOW}Not:${NC} Kurulum bilgileri (DB şifresi vb.) şurada:"
echo "     ${APP_DIR}/install-info.txt"
echo ""
echo -e "${CYAN}Xray Portlar:${NC}"
echo "  VLESS+Reality: 443/tcp"
echo "  Shadowsocks:   1080/tcp+udp"
echo ""
echo -e "${CYAN}Güncelleme:${NC}      bash ${APP_DIR}/update.sh"
echo ""
