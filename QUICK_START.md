# 🚀 快速开始指南

## 方式 1：使用 GitHub Actions CI（最简单）

### 步骤 1：准备工作
1. Fork 本仓库到你的 GitHub 账号
2. 在 Docker Hub 创建访问令牌：https://hub.docker.com/settings/security

### 步骤 2：配置 Secrets
进入你的 GitHub 仓库：
1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下两个 secrets：
   - Name: `DOCKER_USERNAME`, Value: 你的 Docker Hub 用户名
   - Name: `DOCKER_PASSWORD`, Value: 你的 Docker Hub 访问令牌

### 步骤 3：触发构建
**方式 A - 自动触发：**
```bash
git push origin main
```

**方式 B - 手动触发：**
1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Build Unlocked n8n Docker Image**
4. 点击 **Run workflow**
5. 输入标签（可选，默认 `unlocked-latest`）
6. 点击 **Run workflow** 开始

### 步骤 4：等待构建
- 构建时间：约 20-30 分钟
- 可在 Actions 页面查看进度

### 步骤 5：使用镜像
```bash
docker pull <你的用户名>/n8n-unlocked:unlocked-latest

docker run -d -p 5678:5678 \
  -e N8N_AI_ENABLED=true \
  -e N8N_AI_ANTHROPIC_KEY=your-api-key \
  -e N8N_AI_ASSISTANT_BASE_URL=https://api.moonshot.cn \
  -e N8N_AI_MODEL_NAME=moonshot-v1-32k \
  <你的用户名>/n8n-unlocked:unlocked-latest
```

访问：http://localhost:5678

---

## 方式 2：本地构建（需要 Docker）

### Windows PowerShell:
```powershell
# 确保已安装 Node.js 22+ 和 Docker
.\build-unlocked-docker.ps1
```

### Linux/macOS:
```bash
# 确保已安装 Node.js 22+ 和 Docker
chmod +x build-unlocked-docker.sh
./build-unlocked-docker.sh
```

---

## 方式 3：使用 Docker Compose（最快部署）

### 步骤 1：编辑配置
编辑 `docker-compose.unlocked.yml`：
```yaml
services:
  n8n-unlocked:
    image: <你的用户名>/n8n-unlocked:unlocked-latest  # 修改这里
    environment:
      - N8N_AI_ANTHROPIC_KEY=your-api-key              # 修改这里
      - N8N_AI_ASSISTANT_BASE_URL=https://api.moonshot.cn  # 修改这里
      - N8N_AI_MODEL_NAME=moonshot-v1-32k              # 修改这里
```

### 步骤 2：启动服务
```bash
docker-compose -f docker-compose.unlocked.yml up -d
```

### 步骤 3：查看日志
```bash
docker-compose -f docker-compose.unlocked.yml logs -f
```

### 步骤 4：访问
打开浏览器：http://localhost:5678

---

## 🔑 环境变量配置

### 必须设置（3 个）
```bash
N8N_AI_ENABLED=true
N8N_AI_ANTHROPIC_KEY=your-api-key-here
N8N_AI_ASSISTANT_BASE_URL=https://api.xxx.com
```

### 可选设置（2 个）
```bash
N8N_AI_MODEL_NAME=moonshot-v1-32k
N8N_AI_PROVIDER=anthropic  # 或 openai
```

---

## 📝 常见 AI 服务配置示例

### Moonshot AI (Kimi)
```bash
N8N_AI_ASSISTANT_BASE_URL=https://api.moonshot.cn
N8N_AI_MODEL_NAME=moonshot-v1-32k
N8N_AI_PROVIDER=anthropic
```

### OpenAI
```bash
N8N_AI_ASSISTANT_BASE_URL=https://api.openai.com/v1
N8N_AI_MODEL_NAME=gpt-4
N8N_AI_PROVIDER=openai
```

### 自建服务
```bash
N8N_AI_ASSISTANT_BASE_URL=https://your-service.com
N8N_AI_MODEL_NAME=your-model
N8N_AI_PROVIDER=anthropic  # 根据协议选择
```

---

## ❓ 常见问题

### Q: 构建失败怎么办？
A: 检查 GitHub Actions 日志，确保：
- Secrets 配置正确
- Docker Hub 访问令牌有效
- 网络连接正常

### Q: 镜像拉取失败？
A: 确保：
- 镜像名称正确
- Docker Hub 仓库是公开的
- 或已登录 Docker Hub

### Q: AI 功能不可用？
A: 检查：
- `N8N_AI_ANTHROPIC_KEY` 是否设置
- `N8N_AI_ASSISTANT_BASE_URL` 是否正确
- API Key 是否有效
- 网络是否能访问 AI 服务

### Q: 如何更新镜像？
A: 
```bash
# 拉取最新代码
git pull origin main

# 触发新构建（CI）或本地重新构建

# 更新容器
docker-compose pull
docker-compose up -d
```

---

## 📚 更多信息

- 详细文档：`BUILD_DOCKER_README.md`
- 项目总结：`PROJECT_SUMMARY.md`
- 任务记录：`n8n-unlock-task.md`

---

**🎉 开始使用吧！**

