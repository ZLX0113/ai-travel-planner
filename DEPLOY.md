# AI 旅行规划师 — 部署文档（含 API Key 配置）

---

## 目录

1. [获取 LLM API Key](#1-获取-llm-api-key)
2. [本地启动](#2-本地启动)
3. [部署后端到 Railway](#3-部署后端到-railway)
4. [部署前端到 Vercel](#4-部署前端到-vercel)
5. [验证部署](#5-验证部署)

---

## 1. 获取 LLM API Key

项目兼容所有 OpenAI 接口格式的 API 提供商。以下为四种主流方案，**任选其一即可**。

### 方案 A：DeepSeek（推荐，国内首选）

**优势：** 中文能力强、价格低（约为 GPT-4o 的 1/50）、国内网络直连。

**步骤：**

1. 打开 https://platform.deepseek.com
2. 点击右上角「注册」→ 手机号或邮箱注册
3. 登录后进入控制台 → 左侧菜单「API Keys」
4. 点击「创建 API Key」→ 输入名称（如 `travel-planner`）→ 点击「创建」
5. **立即复制**生成的 Key（格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
   > ⚠️ 关闭弹窗后将无法再次查看，需重新创建

**充值：** DeepSeek 采用预付费模式，新用户赠送 10 元额度。在「充值」页面充值最低 10 元即可长期使用。

**`.env` 配置：**

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

---

### 方案 B：OpenAI

**优势：** 模型最强，工具调用能力最优。

**步骤：**

1. 打开 https://platform.openai.com
2. 点击「Sign up」→ 邮箱注册（需科学上网）
3. 登录后进入 Dashboard → 左侧「API keys」
4. 点击「Create new secret key」→ 输入名称 → 点击「Create secret key」
5. **立即复制**生成的 Key（格式：`sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

**充值：** 需要绑定国际信用卡，最低充值 5 美元。新用户通常有免费额度。

**`.env` 配置：**

```ini
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
```

> 如果想降低成本，可将 `LLM_MODEL` 改为 `gpt-4o-mini`（约 1/20 价格）

---

### 方案 C：阿里云通义千问

**优势：** 阿里云生态、中文友好、免费额度充足。

**步骤：**

1. 打开 https://dashscope.aliyun.com
2. 点击「开通DashScope」→ 登录阿里云账号（淘宝/支付宝扫码）
3. 进入控制台 → 左侧「API-KEY管理」
4. 点击「创建 API-KEY」→ 输入名称 → 点击「确定」
5. **立即复制**生成的 Key（格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

**费用：** 新用户有 100 万 Token 免费额度（约 3-6 个月用量）。

**`.env` 配置：**

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

---

### 方案 D：Moonshot（月之暗面）

**优势：** 长文本处理强（128K 上下文）、中文优秀。

**步骤：**

1. 打开 https://platform.moonshot.cn
2. 点击「立即体验」→ 手机号注册
3. 进入控制台 → 左侧「API Keys」
4. 点击「创建 API Key」→ 输入名称 → 点击「创建」
5. **立即复制**生成的 Key

**费用：** 新用户赠送 15 元额度。

**`.env` 配置：**

```ini
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k
```

---

## 2. 本地启动

### 2.1 后端

```powershell
# 1. 进入后端目录
cd backend

# 2. 创建 .env 文件（如果还没创建）
copy .env.example .env

# 3. 编辑 .env，填入上面的 API Key 配置
# 用记事本打开：notepad .env

# 4. 设置依赖路径并启动
$env:PYTHONPATH = "$PWD\lib"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

启动后验证：

```powershell
# 健康检查
Invoke-RestMethod -Uri http://localhost:8000/api/health
# 预期输出: {"status":"ok","service":"AI 旅行规划师"}

# 查看 API 文档
# 浏览器打开 http://localhost:8000/docs
```

### 2.2 前端

```powershell
# 新开一个终端
cd frontend

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

启动后访问 http://localhost:5173

### 2.3 本地验证

1. 打开 http://localhost:5173
2. 在聊天框输入「你好」→ 收到 AI 回复 → 对话功能正常 ✅
3. 点击「🚀 东京5天」快速按钮 → 生成行程 → Agent 流程正常 ✅
4. 点击「📊 多版本对比」→ 显示三个方案 → 多版本正常 ✅
5. 点击「📄 导出 PDF」→ 下载 PDF 文件 → 导出正常 ✅

---

## 3. 部署后端到 Railway

### 3.1 准备工作

确保项目代码已推送到 GitHub 仓库，仓库结构如下：

```
your-repo/
├── backend/
│   ├── Procfile              ← Railway 启动入口
│   ├── requirements.txt      ← Python 依赖
│   ├── .env.example          ← 配置模板
│   └── app/                  ← 应用代码
├── frontend/
│   ├── vercel.json           ← Vercel 配置
│   └── src/
└── GUIDE.md
```

### 3.2 部署步骤

1. 打开 https://railway.app → 点击「Start a New Project」
2. 选择「Deploy from GitHub repo」
3. 授权 Railway 访问 GitHub → 选择你的仓库
4. Railway 会自动检测到 `backend/Procfile`：
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
   ```
5. 在项目设置中配置 **Root Directory** 为 `backend`：
   - 点击项目 → Settings → Root Directory → 输入 `backend`
6. 在 **Variables** 标签页添加环境变量（复制 `.env` 内容）：

   | 变量名 | 值 |
   |--------|-----|
   | `OPENAI_API_KEY` | `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
   | `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` |
   | `LLM_MODEL` | `deepseek-chat` |

7. 点击 **Deploy** → 等待 2-5 分钟
8. 部署完成后，Railway 分配一个域名，例如：
   ```
   https://ai-travel-planner-backend.up.railway.app
   ```
9. 在 Railway 项目的 **Settings → Networking** 中，点击「Generate Domain」生成公开域名

### 3.3 验证后端部署

```powershell
# 替换为你的 Railway 域名
Invoke-RestMethod -Uri https://你的域名.up.railway.app/api/health
```

预期输出：`{"status":"ok","service":"AI 旅行规划师"}`

---

## 4. 部署前端到 Vercel

### 4.1 更新 API 代理地址

部署前，需要将 `frontend/vercel.json` 中的后端地址替换为 Railway 实际域名：

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

### 4.2 部署步骤

1. 打开 https://vercel.com → 点击「New Project」
2. 导入 GitHub 仓库
3. 配置构建设置：

   | 配置项 | 值 |
   |--------|-----|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

4. 点击 **Deploy** → 等待 1-2 分钟
5. 部署完成后，Vercel 分配一个域名，例如：
   ```
   https://ai-travel-planner.vercel.app
   ```

### 4.3 绑定自定义域名（可选）

1. Vercel 项目 → Settings → Domains
2. 输入你的域名（如 `travel.ai-project.com`）
3. 按提示在域名服务商处添加 DNS 记录（CNAME 指向 `cname.vercel-dns.com`）

---

## 5. 验证部署

### 5.1 后端 API

```powershell
# 健康检查
Invoke-RestMethod -Uri https://你的域名.up.railway.app/api/health

# 行程规划
$body = @{
    destination = "东京"
    departure = "北京"
    days = 3
    budget = 8000
} | ConvertTo-Json

Invoke-RestMethod -Uri https://你的域名.up.railway.app/api/trip/plan `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 5.2 前端页面

1. 打开你的 Vercel 域名
2. 测试聊天功能
3. 测试快速规划按钮
4. 测试多版本对比
5. 测试 PDF 导出
6. 测试行程地图显示

---

## 附录：常见问题

### Q: Railway 部署失败，日志显示 `ModuleNotFoundError`

**A:** 检查 Railway 项目的 Root Directory 是否设置为 `backend`。设置路径：Project → Settings → Root Directory → 输入 `backend` → Save。

### Q: 前端页面正常，但 API 请求返回 404

**A:** 检查 `vercel.json` 中的 `destination` 是否已替换为 Railway 实际域名。修改后需要重新 `git push` 触发部署。

### Q: 生成行程时报错 `401 Unauthorized`

**A:** 检查 Railway 的 Variables 中 `OPENAI_API_KEY` 是否正确。确认 Key 未过期、余额充足。

### Q: DeepSeek API 返回 429（限流）

**A:** DeepSeek 免费额度有 QPS 限制。在 Railway Variables 中确保 `LLM_MODEL=deepseek-chat`（非 `deepseek-reasoner`）。

### Q: 如何更新后端代码？

**A:** 直接 `git push` 到 GitHub，Railway 会自动检测并重新部署。无需手动操作。

### Q: 如何查看后端日志？

**A:** Railway 控制台 → 点击项目 → 顶部「Deployments」→ 点击最新的 Deploy → 查看「Build Logs」和「Deploy Logs」。

---

> 最后更新：2026-08-15
> 项目版本：0.1.0