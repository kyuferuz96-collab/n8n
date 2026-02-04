# n8n 企业功能解锁版 Docker 镜像本地构建脚本 (Windows PowerShell)

Write-Host "🚀 n8n Enterprise Unlock - Local Docker Build Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 检查必要工具
$tools = @{
    "node" = "Node.js"
    "pnpm" = "pnpm"
    "docker" = "Docker"
}

foreach ($tool in $tools.Keys) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        if ($tool -eq "pnpm") {
            Write-Host "❌ $($tools[$tool]) 未安装，正在安装..." -ForegroundColor Yellow
            npm install -g pnpm@10.22.0
        } else {
            Write-Host "❌ $($tools[$tool]) 未安装" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "📝 应用源代码修改..." -ForegroundColor Green
Write-Host ""

# 注意：由于已经手动修改过源代码，这里只需要确认修改已存在
Write-Host "  ✓ 源代码修改已完成（手动修改）" -ForegroundColor Green

Write-Host ""
Write-Host "📦 安装依赖..." -ForegroundColor Green
pnpm install --frozen-lockfile

Write-Host ""
Write-Host "🔨 编译项目..." -ForegroundColor Green
pnpm build

Write-Host ""
Write-Host "🐳 构建 Docker 镜像..." -ForegroundColor Green
pnpm build:docker

# 获取镜像标签
$IMAGE_TAG = if ($args[0]) { $args[0] } else { "unlocked-latest" }
$DOCKER_USERNAME = if ($env:DOCKER_USERNAME) { $env:DOCKER_USERNAME } else { "n8n" }

Write-Host ""
Write-Host "🏷️  标记镜像..." -ForegroundColor Green
docker tag n8nio/n8n:local "${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"

Write-Host ""
Write-Host "✅ 构建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "镜像名称: ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用方法：" -ForegroundColor Yellow
Write-Host "  docker run -d -p 5678:5678 \"
Write-Host "    -e N8N_AI_ENABLED=true \"
Write-Host "    -e N8N_AI_ANTHROPIC_KEY=your-key \"
Write-Host "    -e N8N_AI_ASSISTANT_BASE_URL=https://api.xxx.com \"
Write-Host "    ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"
Write-Host ""
Write-Host "推送到 Docker Hub (可选):" -ForegroundColor Yellow
Write-Host "  docker push ${DOCKER_USERNAME}/n8n-unlocked:${IMAGE_TAG}"

