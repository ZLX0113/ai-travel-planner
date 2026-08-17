# Phase 3b: 行程交互修改 + 多版本对比

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现行程局部修改（用户说"换掉第三天景点"）和多版本方案对比（省钱版/舒适版/网红版），增强 Agent 交互性。

**Architecture:** 新增两个 API 端点：`/api/trip/modify` 接收已有行程和修改指令，匹配替换景点；`/api/trip/versions` 用不同预算策略生成多版本方案。前端新增版本切换 Tab 和修改对话按钮。

**Tech Stack:** FastAPI, LangGraph, React + Tailwind

---

### Task 1: 后端行程修改功能

**Files:**
- Modify: `backend/app/tools/itinerary_builder.py` — 添加 `modify_itinerary()` 函数
- Modify: `backend/app/routers/trip.py` — 添加 `POST /api/trip/modify` 端点
- Modify: `backend/app/models/schemas.py` — 添加 `ModifyRequest` 模型

- [ ] **Step 1: 在 `itinerary_builder.py` 末尾添加 `modify_itinerary()` 函数**

```python
def modify_itinerary(
    itinerary: list[DayPlan],
    attractions: list[AttractionInfo],
    modify_request: str,
) -> tuple[list[DayPlan], str]:
    """根据用户修改指令，局部调整行程
    
    Args:
        itinerary: 当前行程
        attractions: 可选景点池
        modify_request: 用户修改指令，如 "第三天换成海边景点"
    
    Returns:
        (修改后的行程, 修改说明)
    """
    import re
    
    # 解析修改指令：提取目标天数和目标类别
    day_match = re.search(r'第\s*(\d+)\s*天', modify_request)
    if not day_match:
        return itinerary, "未能识别修改的目标天数，请用'第X天'的格式描述。"
    
    target_day = int(day_match.group(1))
    if target_day < 1 or target_day > len(itinerary):
        return itinerary, f"只有 {len(itinerary)} 天行程，第{target_day}天不存在。"
    
    # 提取目标类别
    category_map = {
        "海边": "自然", "自然": "自然", "寺庙": "文化", "文化": "文化",
        "美食": "美食", "吃": "美食", "购物": "购物", "买": "购物",
        "娱乐": "娱乐", "玩": "娱乐", "乐园": "娱乐",
        "网红": "购物", "打卡": "文化",
    }
    
    target_category = None
    for keyword, cat in category_map.items():
        if keyword in modify_request:
            target_category = cat
            break
    
    if not target_category:
        # 默认轮换类别
        existing_cats = {a["category"] for a in itinerary[target_day - 1]["activities"]}
        for cat in ["文化", "美食", "购物", "自然", "娱乐"]:
            if cat not in existing_cats:
                target_category = cat
                break
        if not target_category:
            target_category = "文化"
    
    # 从景点池中找匹配的替换景点
    day_plan = itinerary[target_day - 1]
    current_attraction_names = {a["name"] for a in day_plan["activities"]}
    
    candidates = [a for a in attractions if a["category"] == target_category and a["name"] not in current_attraction_names]
    
    if not candidates:
        return itinerary, f"没有找到新的{target_category}类景点可替换。"
    
    # 替换第一个活动
    replacement = candidates[0]
    old_activity = day_plan["activities"][0] if day_plan["activities"] else {"name": "无"}
    
    day_plan["activities"][0] = {
        "name": replacement["name"],
        "time": "上午",
        "duration": replacement["estimated_duration"],
        "notes": replacement["description"],
        "category": replacement["category"],
        "ticket_price": replacement["ticket_price"],
    }
    
    day_plan["notes"] = f"🔄 已替换: {old_activity['name']} → {replacement['name']}"
    
    return itinerary, f"已将第{target_day}天的 {old_activity['name']} 替换为 {replacement['name']}（{replacement['category']}类）"
```

- [ ] **Step 2: 在 `schemas.py` 末尾添加请求模型**

```python
class ModifyRequest(BaseModel):
    """行程修改请求"""
    itinerary: list[dict]  # 当前行程（dict 格式，前端传来）
    attractions: list[dict] = []  # 可选景点池
    modify_request: str  # 修改指令，如 "第三天换成海边景点"
    destination: str = ""
```

- [ ] **Step 3: 在 `trip.py` 中添加 modify 端点**

在 `trip.py` 的 import 中添加：
```python
from app.tools.itinerary_builder import modify_itinerary
from app.models.schemas import ModifyRequest
```

在文件末尾（`router` 定义之后）添加：
```python
@router.post("/modify")
async def modify_trip(request: ModifyRequest):
    """修改已有行程
    
    根据用户指令局部调整行程，如"第三天换成海边景点"
    """
    try:
        # 转换 dict 格式为 DayPlan
        itinerary = request.itinerary
        attractions = request.attractions
        
        modified, message = modify_itinerary(
            itinerary=itinerary,
            attractions=attractions,
            modify_request=request.modify_request,
        )
        
        return {"status": "ok", "itinerary": modified, "message": message}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 4: 验证修改端点**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "
from app.tools.itinerary_builder import modify_itinerary, build_itinerary
from app.tools.search_tools import search_attractions, search_hotels, search_flights

flights = search_flights('北京','东京')
hotels = search_hotels('东京')
attractions = search_attractions('东京', ['美食','文化','购物'])
it = build_itinerary(flights, hotels, attractions, days=3, destination='东京')
print(f'修改前 Day1: {it[0][\"activities\"][0][\"name\"]}')

all_attrs = search_attractions('东京')
new_it, msg = modify_itinerary(it, all_attrs, '第一天换成海边景点')
print(f'修改后 Day1: {new_it[0][\"activities\"][0][\"name\"]}')
print(f'消息: {msg}')
"
```

Expected: 修改成功，Day1 活动被替换为自然类景点

---

### Task 2: 多版本方案生成

**Files:**
- Modify: `backend/app/tools/itinerary_builder.py` — 添加 `generate_versions()` 函数
- Modify: `backend/app/routers/trip.py` — 添加 `POST /api/trip/versions` 端点
- Modify: `backend/app/models/schemas.py` — 添加 `VersionPlanRequest` 模型

- [ ] **Step 1: 在 `itinerary_builder.py` 末尾添加 `generate_versions()` 函数**

```python
# 版本策略定义
VERSION_STRATEGIES = {
    "budget": {  # 省钱版
        "label": "💰 省钱版",
        "description": "精打细算，高性价比",
        "hotel_budget_ratio": 0.15,     # 酒店预算占比
        "flight_budget_ratio": 0.25,    # 机票预算占比
        "attraction_budget_ratio": 0.05, # 景点预算占比
        "preference_weights": {"美食": 2, "自然": 2, "文化": 1},  # 偏好权重（免费景点优先）
    },
    "comfort": {  # 舒适版
        "label": "⭐ 舒适版",
        "description": "品质出行，舒适体验",
        "hotel_budget_ratio": 0.30,
        "flight_budget_ratio": 0.30,
        "attraction_budget_ratio": 0.15,
        "preference_weights": {"文化": 2, "美食": 2, "购物": 1, "自然": 1},
    },
    "trendy": {  # 网红打卡版
        "label": "📸 网红打卡版",
        "description": "出片第一，潮流体验",
        "hotel_budget_ratio": 0.25,
        "flight_budget_ratio": 0.25,
        "attraction_budget_ratio": 0.20,
        "preference_weights": {"娱乐": 3, "购物": 3, "美食": 2, "文化": 1},
    },
}


def generate_version_plan(
    flights: list[FlightInfo],
    hotels: list[HotelInfo],
    attractions: list[AttractionInfo],
    days: int,
    destination: str,
    budget: float | None,
    strategy: str,
    travelers: int = 1,
) -> dict:
    """根据策略生成单版本方案
    
    Args:
        strategy: "budget" | "comfort" | "trendy"
    
    Returns:
        {"label": "💰 省钱版", "description": "...", "itinerary": [...], "budget": BudgetBreakdown}
    """
    from app.tools.budget_calculator import calculate_budget
    
    strat = VERSION_STRATEGIES.get(strategy, VERSION_STRATEGIES["comfort"])
    
    # 按策略筛选酒店
    if budget and hotels:
        hotel_budget = budget * strat["hotel_budget_ratio"] / (days - 1) if days > 1 else None
        filtered_hotels = [h for h in hotels if hotel_budget is None or h["price_per_night"] <= hotel_budget * 2]
        if not filtered_hotels:
            filtered_hotels = sorted(hotels, key=lambda x: x["price_per_night"])[:2]
        selected_hotel_idx = 0
    else:
        filtered_hotels = hotels
        selected_hotel_idx = 0
    
    # 按策略筛选景点
    weights = strat["preference_weights"]
    scored_attractions = []
    for a in attractions:
        score = weights.get(a["category"], 0) + (5 if a["ticket_price"] == 0 else 0)
        scored_attractions.append((score, a))
    scored_attractions.sort(key=lambda x: x[0], reverse=True)
    filtered_attractions = [a for _, a in scored_attractions]
    
    # 按策略选航班
    if budget and flights:
        flight_budget = budget * strat["flight_budget_ratio"]
        filtered_flights = [f for f in flights if f["price"] <= flight_budget]
        if not filtered_flights:
            filtered_flights = sorted(flights, key=lambda x: x["price"])[:1]
    else:
        filtered_flights = flights
    
    # 构建行程
    itinerary = build_itinerary(
        flights=filtered_flights,
        hotels=filtered_hotels,
        attractions=filtered_attractions,
        days=days,
        destination=destination,
        selected_flight_index=0,
        selected_hotel_index=selected_hotel_idx,
    )
    
    # 计算预算
    budget_breakdown = calculate_budget(
        flights=filtered_flights,
        hotels=filtered_hotels,
        attractions=filtered_attractions,
        days=days,
        travelers=travelers,
    )
    
    return {
        "id": strategy,
        "label": strat["label"],
        "description": strat["description"],
        "itinerary": itinerary,
        "budget": budget_breakdown.to_dict(),
    }


def generate_versions(
    flights: list[FlightInfo],
    hotels: list[HotelInfo],
    attractions: list[AttractionInfo],
    days: int,
    destination: str,
    budget: float | None = None,
    travelers: int = 1,
) -> list[dict]:
    """生成多版本方案对比
    
    Returns:
        [budget_version, comfort_version, trendy_version]
    """
    versions = []
    for strategy in ["budget", "comfort", "trendy"]:
        version = generate_version_plan(
            flights=flights,
            hotels=hotels,
            attractions=attractions,
            days=days,
            destination=destination,
            budget=budget,
            strategy=strategy,
            travelers=travelers,
        )
        versions.append(version)
    
    return versions
```

- [ ] **Step 2: 在 `schemas.py` 末尾添加**

```python
class VersionPlanRequest(BaseModel):
    """多版本方案请求"""
    destination: str
    days: int
    budget: Optional[float] = None
    preferences: Optional[list[str]] = None
    departure: Optional[str] = "北京"
    travelers: Optional[int] = 1
```

- [ ] **Step 3: 在 `trip.py` 中添加 versions 端点**

在 import 中添加：
```python
from app.tools.itinerary_builder import generate_versions
from app.models.schemas import VersionPlanRequest
```

添加端点：
```python
@router.post("/versions")
async def plan_versions(request: VersionPlanRequest):
    """生成多版本方案对比（省钱版/舒适版/网红版）"""
    from app.agents.planner_graph import search_node
    
    try:
        # 先搜索数据
        state: PlannerState = {
            "messages": [],
            "destination": request.destination,
            "days": request.days,
            "budget": request.budget,
            "preferences": request.preferences,
            "departure_city": request.departure or "北京",
            "travelers": request.travelers or 1,
            "flights": None,
            "hotels": None,
            "attractions": None,
            "itinerary": None,
            "total_budget_estimate": None,
            "next_step": None,
            "error": None,
        }
        
        state = await search_node(state)
        
        # 生成三个版本
        versions = generate_versions(
            flights=state.get("flights", []),
            hotels=state.get("hotels", []),
            attractions=state.get("attractions", []),
            days=request.days,
            destination=request.destination,
            budget=request.budget,
            travelers=request.travelers or 1,
        )
        
        return {"status": "ok", "versions": versions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 4: 验证版本端点**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "
from app.tools.itinerary_builder import generate_versions
from app.tools.search_tools import search_flights, search_hotels, search_attractions

flights = search_flights('北京','东京')
hotels = search_hotels('东京')
attractions = search_attractions('东京')

versions = generate_versions(flights, hotels, attractions, days=3, destination='东京', budget=10000)
for v in versions:
    print(f'{v[\"label\"]} - {v[\"description\"]}: {len(v[\"itinerary\"])}天, 预算¥{v[\"budget\"][\"total\"]:,.0f}')
"
```

Expected: 三个版本各自有不同预算

---

### Task 3: 前端多版本展示

**Files:**
- Create: `frontend/src/components/VersionTabs.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 `frontend/src/components/VersionTabs.tsx`**

```tsx
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Version {
  id: string
  label: string
  description: string
  budget: { total: number }
  itinerary: Array<{
    day: number
    date: string
    activities: Array<{ name: string; time: string; category: string }>
    hotel: string
  }>
}

interface VersionTabsProps {
  versions: Version[]
}

export default function VersionTabs({ versions }: VersionTabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  if (!versions || versions.length === 0) return null

  const active = versions[activeTab]

  return (
    <div className="my-3 border border-gray-200 rounded-xl overflow-hidden">
      {/* 版本切换 */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {versions.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActiveTab(i)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              i === activeTab
                ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div>{v.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{v.description}</div>
          </button>
        ))}
      </div>

      {/* 预算总览 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-blue-400 font-medium">{active.label}</div>
          <div className="text-2xl font-bold text-blue-600">
            ¥{active.budget.total.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 行程概览 */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {active.itinerary.map((day) => (
          <div key={day.day} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {day.date}
              <span className="text-xs text-gray-400 ml-2">🏨 {day.hotel}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {day.activities.map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {act.time}: {act.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 在 App.tsx 中添加多版本功能**

在 `handleQuickPlan` 函数之后添加 `handleVersions` 函数：

```tsx
  const handleVersions = async () => {
    const planRequest = {
      destination: "东京",
      days: 5,
      budget: 10000,
      preferences: ["美食", "文化"],
      departure: "北京",
      travelers: 1,
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `生成多版本方案：${planRequest.destination} ${planRequest.days}天`,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "正在生成多版本对比方案...",
    }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const response = await fetch("/api/trip/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planRequest),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "📊 已生成三个版本方案，请在下方切换查看：\n\n", versions: data.versions }
            : m
        )
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `[错误] ${err instanceof Error ? err.message : "请求失败"}` }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }
```

在 Message 接口中添加 `versions` 字段：
```tsx
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  versions?: any[]  // 多版本数据
}
```

在快速规划按钮区域添加版本按钮：
```tsx
        <button
          onClick={handleVersions}
          disabled={isLoading}
          className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 transition-all"
        >
          📊 多版本对比
        </button>
```

- [ ] **Step 3: 修改 MessageBubble 支持 VersionTabs**

修改 `MessageBubble.tsx`，在消息有 `versions` 时渲染 `VersionTabs`：

```tsx
import VersionTabs from './VersionTabs'
```

在 `message.versions` 存在时渲染：
```tsx
        {!isUser && message.versions && message.versions.length > 0 && (
          <VersionTabs versions={message.versions} />
        )}
```

---

### Task 4: 前端行程修改对话

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 添加修改行程对话按钮**

在快速规划按钮区域添加：
```tsx
        <button
          onClick={() => handleSend("帮我把第三天的行程换成海边景点")}
          disabled={isLoading}
          className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-full text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-all"
        >
          🔄 修改行程
        </button>
```

---

### Task 5: 验证联调

- [ ] **Step 1: 验证后端端点**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "from app.main import app; routes = [r.path for r in app.routes]; print([r for r in routes if 'trip' in r])"
```

Expected: `['/api/trip/plan', '/api/trip/modify', '/api/trip/versions']`

- [ ] **Step 2: 验证 TypeScript**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\frontend
npx tsc --noEmit --pretty 2>&1 | Select-String "App.tsx|VersionTabs|MessageBubble"
```

Expected: No new errors from our changes

---

## 完成标志

- [ ] modify_itinerary 函数可工作
- [ ] POST /api/trip/modify 端点可访问
- [ ] generate_versions 函数可工作
- [ ] POST /api/trip/versions 端点可访问
- [ ] 前端 VersionTabs 组件可切换
- [ ] 前端修改行程按钮可触发
- [ ] 三个路由全部注册