#!/usr/bin/env bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}[$(date +%H:%M:%S)] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠${NC} $1"; }
err()  { echo -e "${RED}[$(date +%H:%M:%S)] ✗${NC} $1"; }

# ══════════════════════════════════════════
# 配置区
# ══════════════════════════════════════════
FRONTEND_DOMAIN="xiuxian.jeasonloop.online"
API_DOMAIN="xiuxian-api.jeasonloop.online"
PAGES_PROJECT="xiuxian-game"
WORKER_NAME="xiuxian-game-api"
# ══════════════════════════════════════════

FRONTEND_URL="https://${FRONTEND_DOMAIN}"
API_URL="https://${API_DOMAIN}"

echo ""
echo -e "${CYAN}  ⛩️  云灵修仙 — Cloudflare 一键部署${NC}"
echo -e "  前端: ${FRONTEND_URL}"
echo -e "  API:  ${API_URL}"
echo ""

# ── 检查环境 ──
log "检查环境..."
command -v node &>/dev/null || { err "请安装 Node.js: https://nodejs.org"; exit 1; }

if ! npx wrangler --version &>/dev/null 2>&1; then
  warn "安装 wrangler..."
  npm install -g wrangler | tail -3
  ok "wrangler 安装完成"
fi

if ! npx wrangler whoami &>/dev/null 2>&1; then
  warn "Cloudflare 未登录，正在跳转浏览器..."
  npx wrangler login
fi
ok "环境就绪"

# ── 检查域名 ──
log "检查域名 DNS..."
if npx wrangler dns list --json 2>/dev/null | grep -q "jeasonloop.online"; then
  ok "域名 jeasonloop.online 已在 Cloudflare DNS 中"
else
  warn "域名 jeasonloop.online 可能未添加到 Cloudflare DNS"
  warn "请先在 Cloudflare Dashboard → Websites → Add Site 添加域名"
fi

# ── 安装依赖 ──
log "安装依赖..."
npm install --silent
ok "依赖就绪"

# ── 构建前端（注入 API 地址） ──
log "构建前端..."
VITE_API_BASE_URL="${API_URL}" npm run build 2>&1 | while IFS= read -r line; do
  if   echo "$line" | grep -qiE "error|fail";   then echo -e "  ${RED}$line${NC}"
  elif echo "$line" | grep -qiE "✓|built|done"; then echo -e "  ${GREEN}$line${NC}"
  else echo "  $line"; fi
done
ok "前端构建完成 → dist/ (API 地址: ${API_URL}/api)"

# ── 部署前端到 Pages ──
log "部署前端到 Cloudflare Pages..."
npx wrangler pages deploy dist \
  --project-name="${PAGES_PROJECT}" \
  --commit-dirty=true \
  2>&1 | while IFS= read -r line; do
    echo "  $line"
  done
ok "前端部署完成"

# ── 部署后端 Worker ──
log "部署后端 API Worker..."
npx wrangler deploy 2>&1 | while IFS= read -r line; do
  echo "  $line"
done
ok "后端 API 部署完成"

# ── 完成 ──
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         部署完成！                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  前端入口:  ${CYAN}${FRONTEND_URL}${NC}"
echo -e "  API 地址:  ${CYAN}${API_URL}/api${NC}"
echo ""
echo -e "  ${YELLOW}⚠ 还需要在 Cloudflare Dashboard 完成以下步骤:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Pages → ${PAGES_PROJECT} → Custom Domains → 添加 ${CYAN}${FRONTEND_DOMAIN}${NC}"
echo -e "  ${CYAN}2.${NC} Workers → ${WORKER_NAME} → Custom Domains → 添加 ${CYAN}${API_DOMAIN}${NC}"
echo -e "  ${CYAN}3.${NC} 设置 JWT 密钥:  ${CYAN}npx wrangler secret put JWT_SECRET${NC}"
echo ""
