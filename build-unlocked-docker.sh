#!/bin/bash
# n8n 企业功能解锁版 Docker 镜像本地构建脚本

set -e

echo "🚀 n8n Enterprise Unlock - Local Docker Build Script"
echo "=================================================="

# 检查必要工具
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm 未安装，正在安装..."; npm install -g pnpm@10.22.0; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装"; exit 1; }

echo ""
echo "📝 应用源代码修改..."

# 1. 许可证解锁
echo "  ✓ 解锁许可证..."
sed -i.bak 's/return this\.manager?.hasFeatureEnabled(feature) ?? false;/return true; \/\/ 🔓 Unlocked/' packages/cli/src/license.ts

# 2. AI Assistant 强制启用
echo "  ✓ 强制启用 AI Assistant..."
sed -i.bak 's/this\.settings\.aiAssistant\.setup =$/this.settings.aiAssistant.setup = true; \/\/ 🔓/' packages/cli/src/services/frontend.service.ts

# 3. AI Builder 强制启用
echo "  ✓ 强制启用 AI Builder..."
sed -i.bak 's/this\.settings\.aiBuilder\.setup =$/this.settings.aiBuilder.setup = true; \/\/ 🔓/' packages/cli/src/services/frontend.service.ts

# 4. 绕过云服务认证
echo "  ✓ 绕过云服务认证..."
sed -i.bak 's/this\.client,$/process.env.N8N_AI_ANTHROPIC_KEY ? undefined : this.client, \/\/ 🔓/' packages/cli/src/services/ai-workflow-builder.service.ts

# 5. 无限配额
echo "  ✓ 设置无限配额..."
# 这个修改比较复杂，保持原有修改即可

echo ""
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

echo ""
echo "🔨 编译项目..."
pnpm build

echo ""
echo "🐳 构建 Docker 镜像..."
pnpm build:docker

# 获取镜像标签
IMAGE_TAG="${1:-unlocked-latest}"
DOCKER_USERNAME="${DOCKER_USERNAME:-n8n}"

echo ""
echo "🏷️  标记镜像..."
docker tag n8nio/n8n:local ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}

echo ""
echo "✅ 构建完成！"
echo ""
echo "镜像名称: ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"
echo ""
echo "使用方法："
echo "  docker run -d -p 5678:5678 \\"
echo "    -e N8N_AI_ENABLED=true \\"
echo "    -e N8N_AI_ANTHROPIC_KEY=your-key \\"
echo "    -e N8N_AI_ASSISTANT_BASE_URL=https://api.xxx.com \\"
echo "    ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"
echo ""
echo "推送到 Docker Hub (可选):"
echo "  docker push ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"

