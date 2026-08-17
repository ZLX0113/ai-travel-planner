# AI 旅行规划师 — 本地启动 & 部署操作指南

---

## 目录

- [一、前置准备](#一前置准备)
- [二、本地开发环境启动](#二本地开发环境启动)
  - [2.1 后端启动](#21-后端启动)
  - [2.2 前端启动](#22-前端启动)
  - [2.3 验证联调](#23-验证联调)
- [三、部署到云平台](#三部署到云平台)
  - [3.1 部署后端到 Railway](#31-部署后端到-railway)
  - [3.2 部署前端到 Vercel](#32-部署前端到-vercel)
- [四、常用 LLM 提供商配置](#四常用-llm-提供商配置)
- [五、项目架构速览](#五项目架构速览)
- [六、常见问题排查](#六常见问题排查)

---

## 一、前置准备

### 1.1 环境要求

| 工具 | 最低版本 | 检查命令 |
|------|----------|----------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

### 1.2 获取 LLM API Key

项目兼容所有 OpenAI 接口格式的 API 提供商，任选其一：

| 提供商 | 获取地址 | 推荐模型 |
|--------|----------|----------|
| OpenAI | https://platform.openai.com | `gpt-4o` |
| DeepSeek（推荐，性价比高） | https://platform.deepseek.com | `deepseek-chat` |
| 通义千问 | https://dashscope.aliyun.com | `qwen-plus` |
| Moonshot | https://platform.moonshot.cn | `moonshot-v1-8k` |

---

## 二、本地开发环境启动

### 2.1 后端启动

```powershell
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境（首次）
python -m venv venv

# 3. 激活虚拟环境
venv\Scripts\activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 创建环境变量文件
copy .env.example .env
```

**编辑 `.env` 文件**，填入你的 API Key：

```ini
# 示例：使用 OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o

# 示例：使用 DeepSeek（推荐，国内访问快）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

**启动后端服务：**

```powershell
# 方式一：直接启动
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 方式二：通过 main.py 启动
python -m app.main
```

启动成功后访问：
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

### 2.2 前端启动

```powershell
# 1. 进入前端目录（新开终端）
cd frontend

# 2. 安装依赖（首次）
npm install

# 3. 启动开发服务器
npm run dev
```

启动成功后访问：http://localhost:5173

### 2.3 验证联调

前端启动后，Vite 开发服务器会自动将 `/api/*` 请求代理到 `http://localhost:8000`（配置在 `vite.config.ts` 中）。

**快速验证：**

1. 打开 http://localhost:5173
2. 在底部输入框输入"你好"，点击发送
3. 如果收到 AI 回复，说明前后端联调成功
4. 点击"🚀 东京5天"快速规划按钮，验证完整 Agent 流程

**验证 API 端点：**

```powershell
# 健康检查
curl http://localhost:8000/api/health

# 行程规划
curl -X POST http://localhost:8000/api/trip/plan `
  -H "Content-Type: application/json" `
  -d '{"destination":"东京","departure":"北京","days":3,"budget":8000}'

# 多版本方案
curl -X POST http://localhost:8000/api/trip/versions `
  -H "Content-Type: application/json" `
  -d '{"destination":"东京","days":3,"budget":8000}'
```

---

## 三、部署到云平台

### 3.1 部署后端到 Railway

**Railway** 提供免费额度，适合个人项目展示。

#### 步骤：

1. 注册 [Railway](https://railway.app/)（支持 GitHub 登录）

2. 在 Railway 控制台点击 **New Project → Deploy from GitHub repo**

3. 选择你的项目仓库，Railway 会自动检测到 `backend/Procfile`：
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
   ```

4. 设置 **Root Directory** 为 `backend`

5. 在 **Variables** 标签页添加环境变量：

   ```
   OPENAI_API_KEY    = sk-xxxxxxxxxxxxxxxxxxxxxxxx
   OPENAI_BASE_URL   = https://api.deepseek.com/v1
   LLM_MODEL         = deepseek-chat
   ```

6. 点击 **Deploy**，等待部署完成

7. 部署完成后，Railway 会分配一个域名，例如：
   ```
   https://ai-travel-planner-backend.up.railway.app
   ```

8. 验证后端部署：
   ```powershell
   curl https://你的域名.up.railway.app/api/health
   ```

#### 后端项目结构要求：

Railway 会自动识别仓库根目录下的 `Procfile`。确保 `backend/` 目录包含：

```
backend/
├── Procfile              ← Railway 入口
├── requirements.txt      ← Python 依赖
├── .env.example          ← 环境变量模板
└── app/
    ├── main.py
    ├── core/
    ├── models/
    ├── agents/
    ├── tools/
    └── routers/
```

### 3.2 部署前端到 Vercel

**Vercel** 免费额度充足，专为前端项目优化。

#### 步骤：

1. 注册 [Vercel](https://vercel.com/)（支持 GitHub 登录）

2. 在 Vercel 控制台点击 **Add New → Project**

3. 导入你的 GitHub 仓库

4. 配置构建设置：

   | 配置项 | 值 |
   |--------|-----|
   | Framework | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

5. **关键：修改 `frontend/vercel.json`**

   将 `destination` 替换为 Railway 后端的实际域名：

   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://你的域名.up.railway.app/api/:path*"
       }
     ]
   }
   ```

6. 点击 **Deploy**，等待部署完成

7. Vercel 会分配一个域名，例如：
   ```
   https://ai-travel-planner.vercel.app
   ```

8. 打开分配的域名，测试完整功能

#### 部署后的 Vercel + Railway 架构：

```
用户浏览器
    │
    ▼
Vercel (前端静态资源)
    │  /api/*
    ▼
Railway (后端 FastAPI)
    │
    ├── LLM API (OpenAI / DeepSeek)
    └── 行程生成 / 预算计算 / 多版本对比
```

---

## 四、常用 LLM 提供商配置

### DeepSeek（推荐，便宜好用）

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

### 通义千问

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

### OpenAI

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
```

---

## 五、项目架构速览

```
┌──────────────────────────────────────────────────┐
│                    Frontend                       │
│  React 18 + Vite + Tailwind + Leaflet + html2pdf │
│  ┌──────────┬──────────┬──────────┬───────────┐  │
│  │ChatWindow│TripMap   │VersionTab│PDF Export │  │
│  └──────────┴──────────┴──────────┴───────────┘  │
└──────────────────────┬───────────────────────────┘
                       │ /api/*
┌──────────────────────▼───────────────────────────┐
│               Backend (FastAPI)                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  /api/chat        流式对话                   │ │
│  │  /api/trip/plan   行程规划 (SSE)             │ │
│  │  /api/trip/modify 行程修改                   │ │
│  │  /api/trip/versions 多版本方案               │ │
│  │  /api/health      健康检查                   │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │  LangGraph Agent 工作流                      │ │
│  │  search_node → summarize_node               │ │
│  │       │              │                       │ │
│  │  ┌────▼────┐  ┌──────▼──────┐              │ │
│  │  │工具搜索  │  │行程+预算生成 │              │ │
│  │  └─────────┘  └─────────────┘              │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────┘
                       │
              ┌────────▼────────┐
              │  LLM API        │
              │  OpenAI/DeepSeek│
              └─────────────────┘
```

---

## 六、常见问题排查

### Q1: 后端启动报 `ModuleNotFoundError: No module named 'app'`

**原因：** Python 路径问题。

**解决：**
```powershell
# 确保在 backend 目录下运行
cd backend
# 确保虚拟环境已激活
venv\Scripts\activate
# 方式一：使用 -m 模块方式启动
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# 方式二：设置 PYTHONPATH
$env:PYTHONPATH = $PWD
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Q2: 前端页面空白，控制台报 CORS 错误

**原因：** 后端 CORS 未配置或前端端口不匹配。

**解决：**
- 检查 `backend/app/core/config.py` 中 `cors_origins` 是否包含前端地址
- 确保前端通过 `npm run dev` 启动（端口 5173），Vite 会自动代理 `/api`

### Q3: 点击"快速规划"按钮没有反应

**原因：** 后端未启动或 API Key 未配置。

**解决：**
1. 确认后端已启动：访问 http://localhost:8000/api/health
2. 确认 `.env` 中 `OPENAI_API_KEY` 已填写真实 key
3. 查看后端终端日志，排查具体错误

### Q4: 生成行程内容为空或格式错乱

**原因：** LLM 返回格式异常。

**解决：**
- 检查 `LLM_MODEL` 配置是否正确
- 尝试更换模型（如从 `gpt-4o-mini` 换为 `gpt-4o`）
- 查看后端日志中的 LLM 响应内容

### Q5: 地图不显示

**原因：** Leaflet 图标路径问题或网络问题。

**解决：**
- 确认 `index.css` 中有 `@import 'leaflet/dist/leaflet.css'`
- 确认 `TripMap.tsx` 中有图标修复代码
- 如果是部署环境，确保浏览器能访问 `cdnjs.cloudflare.com`（OpenStreetMap 瓦片）

### Q6: Railway 部署报错 `ModuleNotFoundError`

**原因：** Railway 默认不在仓库根目录，依赖安装路径问题。

**解决：**
- 在 Railway 项目设置中，将 **Root Directory** 设为 `backend`
- 确保 `requirements.txt` 在 `backend/` 目录下

### Q7: Vercel 部署后 API 请求 404

**原因：** `vercel.json` 中的 `destination` 域名未更新。

**解决：**
- 将 `frontend/vercel.json` 中的 `https://your-backend.railway.app` 替换为 Railway 实际分配的域名
- 重新提交并部署

---

## 快速命令速查

```powershell
# === 后端 ===
cd backend
venv\Scripts\activate              # 激活虚拟环境
pip install -r requirements.txt    # 安装依赖
python -m uvicorn app.main:app --reload  # 启动（开发模式）

# === 前端 ===
cd frontend
npm install                        # 安装依赖
npm run dev                        # 启动开发服务器
npm run build                      # 生产构建

# === 验证 ===
curl http://localhost:8000/api/health
curl http://localhost:8000/docs
```

---

> 最后更新：2026-08-15
> 项目版本：0.1.0