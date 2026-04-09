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

clear
echo -e "${BLUE}"
cat << 'EOF'
  ╔══════════════════════════════════════════════╗
  ║            X-Pro Bego Installer              ║
  ║   Bağımsız VPN Panel — Marzban Gerektirmez   ║
  ╚══════════════════════════════════════════════╝
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

# ─── GitHub repo ─────────────────────────────────────────────
GITHUB_REPO="${GITHUB_REPO:-https://github.com/cloude4tm-gif/x-pro-bego.git}"

# ─── Sunucu IP ───────────────────────────────────────────────
SERVER_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null \
         || curl -s --connect-timeout 5 api.ipify.org 2>/dev/null \
         || hostname -I | awk '{print $1}')

# ─── Kurulum ayarları ────────────────────────────────────────
echo -e "${CYAN}Kurulum Ayarları${NC}"
echo "───────────────────────────────────────────────"
echo ""

read -p "GitHub repo adresi [${GITHUB_REPO}]: " REPO_INPUT
GITHUB_REPO="${REPO_INPUT:-$GITHUB_REPO}"

read -p "Sunucu IP adresi [${SERVER_IP}]: " IP_INPUT
SERVER_IP="${IP_INPUT:-$SERVER_IP}"

echo ""
read -p "Admin kullanıcı adı [admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

while true; do
  read -s -p "Admin şifresi (min 6 karakter): " ADMIN_PASS
  echo ""
  if [ ${#ADMIN_PASS} -ge 6 ]; then
    read -s -p "Admin şifresi tekrar: " ADMIN_PASS2
    echo ""
    if [ "$ADMIN_PASS" = "$ADMIN_PASS2" ]; then
      break
    else
      warn "Şifreler eşleşmiyor, tekrar deneyin"
    fi
  else
    warn "Şifre en az 6 karakter olmalı"
  fi
done

echo ""
warn "─────────────────────────────────────────────────"
warn "Repo       : ${GITHUB_REPO}"
warn "Sunucu IP  : ${SERVER_IP}"
warn "Admin      : ${ADMIN_USER}"
warn "─────────────────────────────────────────────────"
echo ""
read -p "Kuruluma başlamak için Enter'a basın (Ctrl+C iptal)..."

# ─── Sistem güncellemesi ─────────────────────────────────────
info "Sistem güncelleniyor..."
apt-get update -qq
apt-get install -y -qq curl wget gnupg2 software-properties-common \
  git nginx postgresql postgresql-contrib openssl lsof ufw unzip jq
success "Sistem hazır"

# ─── Marzban kontrolü ────────────────────────────────────────
if systemctl is-active --quiet marzban 2>/dev/null || docker ps 2>/dev/null | grep -q marzban; then
  echo ""
  warn "⚠️  Marzban kurulu görünüyor!"
  warn "X-Pro Bego bağımsız çalışır, Marzban'a gerek yoktur."
  read -p "Marzban durdurulsun mu? [e/H]: " STOP_MARZBAN
  if [[ "$STOP_MARZBAN" =~ ^[Ee]$ ]]; then
    systemctl stop marzban 2>/dev/null || true
    systemctl disable marzban 2>/dev/null || true
    docker stop $(docker ps -q --filter name=marzban) 2>/dev/null || true
    success "Marzban durduruldu"
  fi
fi

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
fi
success "pnpm $(pnpm -v) hazır"

# ─── PM2 ─────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "PM2 kuruluyor..."
  npm install -g pm2 -q
fi
success "PM2 hazır"

# ─── Xray Core ───────────────────────────────────────────────
info "Xray core kuruluyor..."
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then XRAY_ARCH="64"
elif [ "$ARCH" = "aarch64" ]; then XRAY_ARCH="arm64-v8a"
else XRAY_ARCH="64"; fi

XRAY_VERSION=$(curl -s --connect-timeout 10 https://api.github.com/repos/XTLS/Xray-core/releases/latest 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4 || echo "v25.3.6")
XRAY_URL="https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-${XRAY_ARCH}.zip"

mkdir -p /tmp/xray-install
wget -q -O /tmp/xray-install/xray.zip "$XRAY_URL" 2>/dev/null || {
  warn "En son sürüm indirilemedi, v25.3.6 deneniyor..."
  XRAY_VERSION="v25.3.6"
  wget -q -O /tmp/xray-install/xray.zip "https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-${XRAY_ARCH}.zip"
}
cd /tmp/xray-install && unzip -o -q xray.zip
mv -f xray /usr/local/bin/xray && chmod +x /usr/local/bin/xray
cp -f geoip.dat geosite.dat /usr/local/bin/ 2>/dev/null || true
rm -rf /tmp/xray-install
cd /
XRAY_REAL_VER=$(xray version 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 || echo "$XRAY_VERSION")
success "Xray $XRAY_REAL_VER kuruldu"

# ─── x25519 anahtar üret ─────────────────────────────────────
info "VLESS+Reality için x25519 anahtar çifti oluşturuluyor..."
KEY_OUTPUT=$(xray x25519 2>/dev/null || echo "")
PRIVATE_KEY=$(echo "$KEY_OUTPUT" | grep -i "private" | awk '{print $NF}')
PUBLIC_KEY=$(echo "$KEY_OUTPUT" | grep -i "public" | awk '{print $NF}')
if [ -z "$PRIVATE_KEY" ] || [ -z "$PUBLIC_KEY" ]; then
  warn "Anahtar üretimi başarısız, varsayılan kullanılıyor"
  PRIVATE_KEY="wKuxJATmS13Y3U7fAhlQoi78LURfEWopZqlPwAIfrm4"
  PUBLIC_KEY="Hw2UKrhkQ8oV16G-VZ9sey2G8l5i7g6-93_wbLmvKSA"
fi
success "x25519: PrivKey=${PRIVATE_KEY:0:12}... PubKey=${PUBLIC_KEY:0:12}..."

# ─── Xray config ─────────────────────────────────────────────
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
success "Xray konfigürasyonu: ${XRAY_CONFIG_PATH}"

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
success "PostgreSQL: ${DB_NAME}@localhost"

# ─── Uygulamayı klonla ───────────────────────────────────────
info "Uygulama indiriliyor..."
if [ -d "$APP_DIR/.git" ]; then
  warn "Mevcut kurulum bulundu, güncelleniyor..."
  cd "$APP_DIR" && git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
elif [ -d "$APP_DIR" ]; then
  rm -rf "$APP_DIR"
  git clone "$GITHUB_REPO" "$APP_DIR"
else
  git clone "$GITHUB_REPO" "$APP_DIR"
fi
success "Uygulama: $APP_DIR"

# ─── Environment dosyası ─────────────────────────────────────
info ".env dosyası oluşturuluyor..."
cat > "$APP_DIR/.env" << ENV
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
success ".env oluşturuldu"

# ─── Bağımlılıklar ───────────────────────────────────────────
info "Node.js bağımlılıkları yükleniyor..."
cd "$APP_DIR"
pnpm install --frozen-lockfile 2>&1 | tail -3
success "Bağımlılıklar yüklendi"

# ─── Veritabanı tabloları ────────────────────────────────────
info "Veritabanı tabloları oluşturuluyor..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
pnpm --filter @workspace/db push 2>&1 | tail -3
success "Veritabanı tabloları hazır"

# ─── Frontend build ───────────────────────────────────────────
if [ -d "$APP_DIR/artifacts/marzban-analytics/dist/public/assets" ]; then
  success "Frontend önceden derlenmiş (dist mevcut), atlanıyor"
else
  info "Frontend derleniyor..."
  pnpm --filter @workspace/marzban-analytics run build 2>&1 | tail -5
  success "Frontend derlendi"
fi

# ─── API Server build ─────────────────────────────────────────
info "API Server derleniyor..."
cd "$APP_DIR/artifacts/api-server"
pnpm run build 2>&1 | tail -3
success "API Server derlendi"

# ─── PM2 ecosystem ────────────────────────────────────────────
info "PM2 servisler yapılandırılıyor..."
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

pm2 delete xprobego-api 2>/dev/null || true
pm2 delete xprobego-xray 2>/dev/null || true
cd "$APP_DIR"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "^sudo\|^systemctl" | bash 2>/dev/null || true
success "PM2 servisleri çalışıyor"

# ─── Admin hesabı oluştur ────────────────────────────────────
info "Admin hesabı oluşturuluyor..."
sleep 3
ADMIN_RESP=$(curl -s --connect-timeout 10 -X POST "http://localhost:${API_PORT}/api/admin/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}&password=${ADMIN_PASS}&grant_type=password" 2>/dev/null || echo "")
if echo "$ADMIN_RESP" | grep -q "access_token"; then
  success "Admin hesabı oluşturuldu: ${ADMIN_USER}"
else
  warn "Admin hesabı henüz oluşturulamadı — panel açıldığında ilk girişte oluşturulacak"
fi

# ─── Nginx ───────────────────────────────────────────────────
info "Nginx yapılandırılıyor..."
echo ""
read -p "Sunucu domain veya IP [${SERVER_IP}]: " SERVER_DOMAIN
SERVER_DOMAIN="${SERVER_DOMAIN:-${SERVER_IP}}"

cat > "/etc/nginx/sites-available/xprobego" << NGINX
server {
    listen 80;
    server_name ${SERVER_DOMAIN};
    client_max_body_size 20M;

    # Frontend static dosyalar
    root ${APP_DIR}/artifacts/marzban-analytics/dist/public;
    index index.html;

    # API → Express (port ${API_PORT})
    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
}
NGINX

ln -sf /etc/nginx/sites-available/xprobego /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
success "Nginx yapılandırıldı"

# ─── Güvenlik Duvarı ─────────────────────────────────────────
info "Güvenlik duvarı yapılandırılıyor..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1080/tcp
ufw allow 1080/udp
ufw deny "${API_PORT}/tcp" 2>/dev/null || true
success "UFW güvenlik duvarı aktif"

# ─── SSL (opsiyonel) ──────────────────────────────────────────
if [[ "$SERVER_DOMAIN" =~ \. ]] && ! [[ "$SERVER_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo ""
  read -p "SSL sertifikası kurunsun mu? (Let's Encrypt) [e/H]: " INSTALL_SSL
  if [[ "$INSTALL_SSL" =~ ^[Ee]$ ]]; then
    apt-get install -y -qq certbot python3-certbot-nginx
    certbot --nginx -d "$SERVER_DOMAIN" --non-interactive --agree-tos \
      -m "admin@${SERVER_DOMAIN}" 2>&1 | tail -5 || warn "SSL kurulumu başarısız"
  fi
fi

# ─── Yönetim scripti ─────────────────────────────────────────
cat > "/usr/local/bin/xpb" << 'XPB'
#!/bin/bash
# X-Pro Bego Yönetim Aracı
APP_DIR="/opt/x-pro-bego"
API_PORT=8080
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

case "$1" in
  status)
    echo -e "${CYAN}=== X-Pro Bego Durum ===${NC}"
    pm2 list | grep -E "xprobego|name"
    echo ""
    echo -e "${CYAN}API Sağlık:${NC}"
    curl -s http://localhost:${API_PORT}/api/healthz 2>/dev/null || echo "API yanıt vermiyor"
    ;;
  restart)
    echo "[*] Tüm servisler yeniden başlatılıyor..."
    pm2 restart xprobego-api && pm2 restart xprobego-xray
    echo -e "${GREEN}[✓] Yeniden başlatıldı${NC}"
    ;;
  restart-api)
    pm2 restart xprobego-api && echo -e "${GREEN}[✓] API yeniden başlatıldı${NC}"
    ;;
  restart-xray)
    pm2 restart xprobego-xray && echo -e "${GREEN}[✓] Xray yeniden başlatıldı${NC}"
    ;;
  logs)
    pm2 logs "${2:-xprobego-api}" --lines 100
    ;;
  logs-xray)
    pm2 logs xprobego-xray --lines 100
    ;;
  update)
    bash "$APP_DIR/update.sh"
    ;;
  info)
    cat "$APP_DIR/install-info.txt" 2>/dev/null || echo "Kurulum bilgisi bulunamadı"
    ;;
  stop)
    pm2 stop xprobego-api && pm2 stop xprobego-xray
    echo -e "${YELLOW}[!] Tüm servisler durduruldu${NC}"
    ;;
  start)
    pm2 start xprobego-api && pm2 start xprobego-xray
    echo -e "${GREEN}[✓] Tüm servisler başlatıldı${NC}"
    ;;
  *)
    echo -e "${CYAN}X-Pro Bego Yönetim Aracı${NC}"
    echo ""
    echo "Kullanım: xpb <komut>"
    echo ""
    echo "Komutlar:"
    echo "  xpb status         → Tüm servislerin durumu"
    echo "  xpb restart        → Tüm servisleri yeniden başlat"
    echo "  xpb restart-api    → Sadece API'yi yeniden başlat"
    echo "  xpb restart-xray   → Sadece Xray'i yeniden başlat"
    echo "  xpb logs           → API loglarını göster"
    echo "  xpb logs-xray      → Xray loglarını göster"
    echo "  xpb update         → Paneli güncelle"
    echo "  xpb info           → Kurulum bilgilerini göster"
    echo "  xpb stop           → Tüm servisleri durdur"
    echo "  xpb start          → Tüm servisleri başlat"
    ;;
esac
XPB
chmod +x /usr/local/bin/xpb
success "Yönetim aracı: 'xpb' komutu kullanılabilir"

# ─── Güncelleme scripti ───────────────────────────────────────
cat > "$APP_DIR/update.sh" << 'UPDATE'
#!/bin/bash
set -e
APP_DIR="/opt/x-pro-bego"
GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
echo -e "${CYAN}[*] X-Pro Bego güncelleniyor...${NC}"
cd "$APP_DIR"

OLD_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || { echo "Git pull başarısız!"; exit 1; }
NEW_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)

pnpm install --frozen-lockfile --silent
pnpm --filter @workspace/db push

# Frontend: kaynak değiştiyse veya dist yoksa yeniden derle
if [ ! -d "$APP_DIR/artifacts/marzban-analytics/dist/public/assets" ]; then
  echo "[*] Frontend derleniyor..."
  pnpm --filter @workspace/marzban-analytics run build
elif [ -n "$OLD_HASH" ] && [ "$OLD_HASH" != "$NEW_HASH" ]; then
  if git diff --name-only "$OLD_HASH" "$NEW_HASH" 2>/dev/null | grep -q "artifacts/marzban-analytics/src/"; then
    echo "[*] Frontend kaynak değişti, yeniden derleniyor..."
    pnpm --filter @workspace/marzban-analytics run build
  else
    echo "[✓] Frontend değişmedi"
  fi
fi

# API server her zaman derlenir
echo "[*] API server derleniyor..."
cd artifacts/api-server && pnpm run build && cd "$APP_DIR"

pm2 restart xprobego-api
echo -e "${GREEN}[✓] Güncelleme tamamlandı!${NC}"
UPDATE
chmod +x "$APP_DIR/update.sh"

# ─── Kurulum bilgileri kaydet ─────────────────────────────────
cat > "$APP_DIR/install-info.txt" << INFO
X-Pro Bego Kurulum Bilgileri
============================
Kurulum Tarihi  : $(date)
Uygulama Dizini : ${APP_DIR}
API Port        : ${API_PORT}
Domain/IP       : ${SERVER_DOMAIN}
Sunucu IP       : ${SERVER_IP}

PostgreSQL:
  Veritabanı    : ${DB_NAME}
  Kullanıcı     : ${DB_USER}
  Şifre         : ${DB_PASS}
  URL           : postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

Session Secret  : ${SESSION_SECRET}

Xray:
  Config        : ${XRAY_CONFIG_PATH}
  VLESS Port    : 443/tcp (Reality)
  SS Port       : 1080/tcp+udp (Shadowsocks)
  Private Key   : ${PRIVATE_KEY}
  Public Key    : ${PUBLIC_KEY}

Panel Girişi:
  URL           : http://${SERVER_DOMAIN}
  Admin         : ${ADMIN_USER}
  Şifre         : [kurulum sırasında belirlendi]

Komutlar:
  xpb status         → Servis durumu
  xpb logs           → API logları
  xpb update         → Güncelleme
  xpb restart        → Yeniden başlat
  xpb info           → Bu bilgiler
INFO
chmod 600 "$APP_DIR/install-info.txt"

# ─── Tamamlandı ───────────────────────────────────────────────
clear
echo -e "${GREEN}"
cat << 'EOF'
  ╔══════════════════════════════════════════════╗
  ║         Kurulum Tamamlandı!                  ║
  ╚══════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo -e "${CYAN}Panel Adresi:${NC}   http://${SERVER_DOMAIN}"
echo -e "${CYAN}Admin:${NC}          ${ADMIN_USER}"
echo ""
echo -e "${CYAN}VPN Portları:${NC}"
echo "  VLESS+Reality : 443/tcp"
echo "  Shadowsocks   : 1080/tcp + 1080/udp"
echo ""
echo -e "${CYAN}Servisler:${NC}"
pm2 list | grep -E "xprobego|name" 2>/dev/null || true
echo ""
echo -e "${CYAN}Yönetim Komutları:${NC}"
echo "  xpb status    → Durum"
echo "  xpb logs      → Loglar"
echo "  xpb update    → Güncelle"
echo "  xpb restart   → Yeniden başlat"
echo ""
echo -e "${YELLOW}Kurulum bilgileri:${NC} cat ${APP_DIR}/install-info.txt"
echo ""
