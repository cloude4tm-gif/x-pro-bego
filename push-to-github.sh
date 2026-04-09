#!/bin/bash
# ============================================================
# X-Pro Bego — GitHub'a Yükleme Scripti
# Kullanım: bash push-to-github.sh <github-kullanici-adi> <repo-adi>
# Örnek:    bash push-to-github.sh ahmetyilmaz x-pro-bego
# ============================================================

set -e

GITHUB_USER="${1}"
REPO_NAME="${2:-x-pro-bego}"

if [ -z "$GITHUB_USER" ]; then
  echo "❌ GitHub kullanıcı adı gerekli!"
  echo "   Kullanım: bash push-to-github.sh <github-kullanici-adi> [repo-adi]"
  exit 1
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "================================================"
echo "  X-Pro Bego → GitHub Push"
echo "  Repo: ${REMOTE_URL}"
echo "================================================"

# .env dosyalarını gitignore'a ekle (güvenlik)
if ! grep -q "\.env" .gitignore 2>/dev/null; then
  echo -e "\n# Environment files\n.env\n.env.*\n!.env.example" >> .gitignore
  echo "✅ .env dosyaları gitignore'a eklendi"
fi

# .local klasörü zaten gitignore'da ama kontrol et
if ! grep -q "\.local/" .gitignore 2>/dev/null; then
  echo ".local/" >> .gitignore
fi

# Mevcut remote kontrolü
if git remote get-url origin &>/dev/null; then
  echo "⚠️  Mevcut remote bulundu, güncelleniyor..."
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "✅ Remote: $REMOTE_URL"

# Stage all changes
git add -A

# Commit varsa push, yoksa ilk commit oluştur
if git diff --cached --quiet; then
  echo "📦 Commit edilecek değişiklik yok, direkt push yapılıyor..."
else
  git commit -m "chore: X-Pro Bego production ready - enterprise features complete"
  echo "✅ Commit oluşturuldu"
fi

echo ""
echo "📤 GitHub'a push yapılıyor..."
echo "   (GitHub kullanıcı adı ve token/şifre istenebilir)"
echo ""

git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
  echo ""
  echo "⚠️  Push başarısız! Muhtemel sebepler:"
  echo "   1. GitHub'da '${REPO_NAME}' reposu oluşturulmamış"
  echo "   2. Token/şifre hatalı"
  echo ""
  echo "   → https://github.com/new adresinden '${REPO_NAME}' adında"
  echo "     boş (README olmadan) bir repo oluşturun, sonra tekrar deneyin."
  echo ""
  echo "   GitHub Personal Access Token için:"
  echo "   → https://github.com/settings/tokens"
  exit 1
}

echo ""
echo "🎉 Başarıyla yüklendi!"
echo "   → https://github.com/${GITHUB_USER}/${REPO_NAME}"
