# n8n 企业功能解锁版 Docker 镜像构建指南

本项目通过 GitHub Actions CI/CD 自动构建包含企业功能解锁和 AI Builder 直连的 n8n Docker 镜像。

## 🎯 功能特性

### 已解锁的企业功能
- ✅ **全局许可证绕过** - 所有企业版功能无需许可证
- ✅ **AI Builder** - 强制启用 AI 工作流构建器
- ✅ **直连 LLM（AI Builder）** - 使用本地 API Key 直连模型，不依赖 n8n 云端代理
- ✅ **无限配额** - 绕过远端配额查询，返回无限额度
- ✅ **自定义模型** - 支持切换 OpenAI/Anthropic 协议和自定义模型

## 📦 使用 CI 构建镜像

### 前置要求

1. **Fork 本仓库** 到你的 GitHub 账号
2. **配置 GitHub Secrets**（Settings → Secrets and variables → Actions）：
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub 访问令牌

### 自动构建

#### 方式 1：推送代码触发
```bash
git push origin main
```
推送到 `main` 或 `master` 分支会自动触发构建。

#### 方式 2：手动触发
1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Build Unlocked n8n Docker Image** workflow
4. 点击 **Run workflow**
5. 输入自定义标签（可选，默认为 `unlocked-latest`）
6. 点击 **Run workflow** 开始构建

### 构建产物

构建完成后，镜像会推送到：
```
docker.io/<你的用户名>/n8n-unlocked:unlocked-latest
```

## 🚀 使用解锁版镜像

### Docker Compose 配置示例

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  n8n:
    image: <你的用户名>/n8n-unlocked:unlocked-latest
    container_name: n8n-unlocked
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # 基础配置
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      
      # 🔓 AI 功能配置（必须）
      - N8N_AI_ENABLED=true
      - N8N_AI_ANTHROPIC_KEY=your-api-key-here
      # 工作流生成器直连 LLM 的自定义 Base URL（可选）
      # - provider=anthropic: https://api.anthropic.com
      # - provider=openai: https://api.openai.com/v1
      - N8N_AI_LLM_BASE_URL=
      
      # 🔓 自定义模型配置（可选）
      - N8N_AI_MODEL_NAME=kimi-k2.5
      - N8N_AI_PROVIDER=anthropic  # 或 openai
      
      # 数据持久化
      - N8N_USER_FOLDER=/home/node/.n8n
      
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

### 启动服务

```bash
docker-compose up -d
```

访问 `http://localhost:5678` 即可使用。

## 🔧 环境变量说明

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `N8N_AI_ENABLED` | ✅ | - | 全局开启 AI 模块 |
| `N8N_AI_ANTHROPIC_KEY` | ✅ | - | API Key（设置后自动切换为直连模式） |
| `N8N_AI_LLM_BASE_URL` | ❌ | - | 直连 LLM 的 API Base URL（不影响 n8n 官方 AI Assistant） |
| `N8N_AI_ASSISTANT_BASE_URL` | ❌ | - | n8n 官方 AI Assistant Service Base URL（通常留空） |
| `N8N_AI_MODEL_NAME` | ❌ | - | 自定义模型名称 |
| `N8N_AI_PROVIDER` | ❌ | `anthropic` | 协议类型：`anthropic` 或 `openai` |

### API 路径自动补全

- **Anthropic 模式**：自动补全 `/v1/messages`
- **OpenAI 模式**：自动补全 `/chat/completions`

示例：
```bash
# Anthropic 兼容接口
N8N_AI_LLM_BASE_URL=https://api.your-anthropic-proxy.com
# 实际请求：https://api.your-anthropic-proxy.com/v1/messages

# OpenAI 兼容接口
N8N_AI_PROVIDER=openai
N8N_AI_LLM_BASE_URL=https://api.openai.com/v1
# 实际请求：https://api.openai.com/v1/chat/completions
```

## 📝 源代码修改说明

CI 会自动应用以下修改：

1. **`packages/cli/src/license.ts`**
   - 硬编码 `isLicensed()` 返回 `true`

2. **`packages/cli/src/services/frontend.service.ts`**
   - 强制 `aiAssistant.setup = true`
   - 强制 `aiBuilder.setup = true`

3. **`packages/cli/src/services/ai-workflow-builder.service.ts`**
   - 当设置 `N8N_AI_ANTHROPIC_KEY` 时，不传递云服务 client

4. **`packages/cli/src/controllers/ai.controller.ts`**
   - `/ai/build/credits` 接口返回无限配额

## ⚠️ 注意事项

1. **仅供学习研究使用**，请勿用于生产环境
2. 绕过许可证可能违反 n8n 的使用条款
3. 建议使用私有 Docker Registry 存储镜像
4. 定期更新基础镜像以获取安全补丁

## 🔄 更新镜像

当 n8n 官方发布新版本时：

1. 拉取最新代码：
   ```bash
   git pull upstream main
   ```

2. 推送触发构建：
   ```bash
   git push origin main
   ```

3. 更新 Docker Compose：
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 📚 相关资源

- [n8n 官方文档](https://docs.n8n.io/)
- [n8n GitHub 仓库](https://github.com/n8n-io/n8n)
- [Docker Hub](https://hub.docker.com/)

## 📄 许可证

本项目基于 n8n 的原始许可证，修改部分仅供学习参考。

