# Phase 4: 地图可视化 + PDF 导出 + 部署

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 添加行程地图可视化（Leaflet 交互地图）、一键导出 PDF、以及部署到云平台，让项目从 Demo 变为可展示的完整产品。

**Architecture:** 前端新增 `TripMap` 组件（Leaflet + OpenStreetMap），在景点数据中嵌入坐标，地图上展示每日行程路线。PDF 导出使用 `html2pdf.js` 客户端生成。部署配置：前端 Vercel，后端 Railway。

**Tech Stack:** Leaflet, react-leaflet, html2pdf.js, Vercel, Railway

---

### Task 1: 地图可视化

**Files:**
- Create: `frontend/src/components/TripMap.tsx`
- Modify: `frontend/src/App.tsx` — 添加地图展示
- Modify: `frontend/package.json` — 安装 leaflet 依赖
- Modify: `frontend/src/index.css` — leaflet 样式

- [ ] **Step 1: 安装 leaflet 依赖**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

- [ ] **Step 2: 创建 `frontend/src/components/TripMap.tsx`**

```tsx
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// 景点坐标映射（主要城市知名景点）
const ATTRACTION_COORDS: Record<string, [number, number]> = {
  // 东京
  "浅草寺": [35.7148, 139.7967],
  "秋叶原": [35.7023, 139.7745],
  "筑地市场": [35.6654, 139.7707],
  "涩谷十字路口": [35.6595, 139.7004],
  "东京迪士尼乐园": [35.6329, 139.8804],
  "明治神宫": [35.6764, 139.6993],
  "新宿御苑": [35.6852, 139.7100],
  "银座": [35.6717, 139.7650],
  // 大阪
  "大阪城": [34.6873, 135.5259],
  "道顿堀": [34.6687, 135.5013],
  "环球影城": [34.6654, 135.4323],
  "心斋桥": [34.6725, 135.4998],
  "通天阁": [34.6525, 135.5063],
  // 曼谷
  "大皇宫": [13.7500, 100.4914],
  "恰图恰周末市场": [13.8000, 100.5510],
  "考山路": [13.7588, 100.4974],
  "卧佛寺": [13.7465, 100.4930],
  // 巴黎
  "埃菲尔铁塔": [48.8584, 2.2945],
  "卢浮宫": [48.8606, 2.3376],
  "香榭丽舍大街": [48.8698, 2.3075],
  "蒙马特高地": [48.8867, 2.3431],
}

// 城市中心坐标
const CITY_CENTERS: Record<string, [number, number]> = {
  "东京": [35.6762, 139.6503],
  "大阪": [34.6937, 135.5023],
  "曼谷": [13.7563, 100.5018],
  "巴黎": [48.8566, 2.3522],
}

interface Activity {
  name: string
  time: string
  category: string
}

interface DayPlan {
  day: number
  date: string
  activities: Activity[]
  hotel: string
}

interface TripMapProps {
  itinerary: DayPlan[]
  destination: string
}

function FitBounds({ itinerary, destination }: { itinerary: DayPlan[]; destination: string }) {
  const map = useMap()

  useEffect(() => {
    const coords: [number, number][] = []
    itinerary.forEach((day) => {
      day.activities.forEach((act) => {
        const coord = ATTRACTION_COORDS[act.name]
        if (coord) coords.push(coord)
      })
    })

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])))
      map.fitBounds(bounds, { padding: [40, 40] })
    } else {
      const center = CITY_CENTERS[destination] || [35.6762, 139.6503]
      map.setView(center, 12)
    }
  }, [itinerary, destination, map])

  return null
}

export default function TripMap({ itinerary, destination }: TripMapProps) {
  const center = CITY_CENTERS[destination] || [35.6762, 139.6503]

  // 收集所有有坐标的景点
  const markers: { name: string; coord: [number, number]; day: number; category: string }[] = []
  itinerary.forEach((day) => {
    day.activities.forEach((act) => {
      const coord = ATTRACTION_COORDS[act.name]
      if (coord) {
        markers.push({ name: act.name, coord, day: day.day, category: act.category })
      }
    })
  })

  // 按天分组连线
  const polylines: [number, number][][] = []
  itinerary.forEach((day) => {
    const dayCoords: [number, number][] = []
    day.activities.forEach((act) => {
      const coord = ATTRACTION_COORDS[act.name]
      if (coord) dayCoords.push(coord)
    })
    if (dayCoords.length > 1) polylines.push(dayCoords)
  })

  const dayColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-200">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
        🗺️ 行程地图
      </div>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds itinerary={itinerary} destination={destination} />

        {markers.map((m, i) => (
          <Marker key={i} position={m.coord}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">Day {m.day} · {m.category}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {polylines.map((line, i) => (
          <Polyline
            key={i}
            positions={line}
            color={dayColors[i % dayColors.length]}
            weight={3}
            opacity={0.7}
            dashArray="8 4"
          />
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Step 3: 在 MessageBubble 中渲染 TripMap**

修改 `frontend/src/components/MessageBubble.tsx`，添加 import：
```tsx
import TripMap from './TripMap'
```

当消息有 `itinerary` 数据时，在 VersionTabs 后面渲染地图。修改 MessageBubble 内容：

在 `{message.versions && ...}` 之后添加：
```tsx
            {message.itinerary && message.itinerary.length > 0 && (
              <TripMap itinerary={message.itinerary} destination={message.destination || ''} />
            )}
```

同时更新 Message 接口的 `itinerary` 字段（在 App.tsx 中）：
```tsx
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  versions?: any[]
  itinerary?: any[]
  destination?: string
}
```

- [ ] **Step 4: 在 API 响应中传递 itinerary 数据**

修改 `frontend/src/App.tsx` 的 `handleQuickPlan`，在收到 `itinerary` SSE 事件时保存数据，并在 `done` 时设置到消息上：

在 SSE 解析循环中添加：
```tsx
              } else if (parsed.status === "itinerary" && parsed.data) {
                tripItinerary = parsed.data
```

在 `handleQuickPlan` 开头声明：
```tsx
    let tripItinerary: any[] | null = null
```

在 done 时设置：
```tsx
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: finalContent, itinerary: tripItinerary, destination: planRequest.destination }
                      : m
                  )
                )
```

- [ ] **Step 5: 在 index.css 中添加 leaflet 样式**

在 `frontend/src/index.css` 末尾添加：
```css
@import 'leaflet/dist/leaflet.css';

.leaflet-container {
  z-index: 0;
}
```

---

### Task 2: PDF 导出

**Files:**
- Modify: `frontend/package.json` — 安装 html2pdf.js
- Modify: `frontend/src/App.tsx` — 添加导出按钮

- [ ] **Step 1: 安装 html2pdf.js**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\frontend
npm install html2pdf.js
```

- [ ] **Step 2: 在 App.tsx 添加导出功能**

在 `App.tsx` 的 import 中添加：
```tsx
import html2pdf from 'html2pdf.js'
```

添加导出函数：
```tsx
  const handleExportPDF = () => {
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant' && m.content.length > 50)
    if (!lastAssistantMsg) return

    const element = document.createElement('div')
    element.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          ✈️ AI 旅行规划师
        </h1>
        <div style="font-size: 14px; line-height: 1.8; color: #333;">
          ${lastAssistantMsg.content.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #999; font-size: 12px; text-align: center;">
          由 AI 旅行规划师生成 · ${new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>
    `

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `旅行行程_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    }

    html2pdf().set(opt).from(element).save()
  }
```

在快速规划按钮区域添加导出按钮：
```tsx
        <button
          onClick={handleExportPDF}
          disabled={isLoading}
          className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 transition-all"
        >
          📄 导出 PDF
        </button>
```

---

### Task 3: 部署配置

**Files:**
- Create: `frontend/vercel.json`
- Create: `backend/railway.json` (or Procfile)

- [ ] **Step 1: 创建 `frontend/vercel.json`**

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.railway.app/api/:path*"
    }
  ]
}
```

- [ ] **Step 2: 创建 `backend/Procfile`**

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 3: 批量更新 requirements.txt 明确版本**

读取当前 `backend/requirements.txt`，确保包含所有依赖：
```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
openai>=1.30.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
langgraph>=0.2.0
```

- [ ] **Step 4: 创建 `backend/.env.example`**

```ini
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
HOST=0.0.0.0
PORT=8000
```

---

### Task 4: 验证联调

- [ ] **Step 1: 验证前端编译**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\frontend
npm run build 2>&1 | Select-String "error|warning|✓ built"
```

Expected: `✓ built` with no errors

- [ ] **Step 2: 验证后端路由**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "from app.main import app; routes = [r.path for r in app.routes]; print('All routes:', len(routes)); print('Trip routes:', [r for r in routes if 'trip' in r])"
```

Expected: 3 trip routes

---

## 完成标志

- [ ] 地图组件可渲染景点标记
- [ ] PDF 导出可生成文件
- [ ] 部署配置文件就绪
- [ ] 前端 build 无错误