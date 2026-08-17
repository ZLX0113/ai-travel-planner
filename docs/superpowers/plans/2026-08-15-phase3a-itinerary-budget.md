# Phase 3a: 行程模板与预算自动计算

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现结构化的行程模板生成器和预算自动计算引擎，将搜索结果转化为可交互的 DayPlan 对象和预算明细，替代纯 LLM 文本输出。

**Architecture:** 新增两个独立模块：`budget_calculator.py`（纯函数，从搜索结果计算预算明细）和 `itinerary_builder.py`（将搜索结果编排为 DayPlan 列表）。修改 `summarize_node` 调用这两个模块，在返回 LLM 文本的同时填充 `state["itinerary"]` 和 `state["total_budget_estimate"]`。前端新增行程卡片组件展示结构化数据。

**Tech Stack:** Python, Pydantic, React + Tailwind

---

### Task 1: 创建预算计算器模块

**Files:**
- Create: `backend/app/tools/budget_calculator.py`

- [ ] **Step 1: 创建 `backend/app/tools/budget_calculator.py`**

```python
"""预算自动计算模块"""

from app.agents.state import FlightInfo, HotelInfo, AttractionInfo


# 常量
MEAL_COST_PER_DAY = 150  # 每人每天餐饮估算（元）
TRANSPORT_COST_PER_DAY = 50  # 每人每天市内交通估算（元）
INSURANCE_COST = 100  # 旅行保险（元）
MISC_COST_PER_DAY = 80  # 杂费/购物（元）


class BudgetBreakdown:
    """预算明细"""

    def __init__(
        self,
        flights: float = 0,
        hotels: float = 0,
        attractions: float = 0,
        meals: float = 0,
        transport: float = 0,
        insurance: float = 0,
        misc: float = 0,
    ):
        self.flights = flights
        self.hotels = hotels
        self.attractions = attractions
        self.meals = meals
        self.transport = transport
        self.insurance = insurance
        self.misc = misc

    @property
    def total(self) -> float:
        return round(
            self.flights
            + self.hotels
            + self.attractions
            + self.meals
            + self.transport
            + self.insurance
            + self.misc,
            2,
        )

    def to_dict(self) -> dict:
        return {
            "flights": self.flights,
            "hotels": self.hotels,
            "attractions": self.attractions,
            "meals": self.meals,
            "transport": self.transport,
            "insurance": self.insurance,
            "misc": self.misc,
            "total": self.total,
        }

    def to_markdown_table(self) -> str:
        """生成 Markdown 格式的预算明细表"""
        return f"""| 项目 | 费用（元） |
|------|-----------|
| ✈️ 机票 | ¥{self.flights:,.0f} |
| 🏨 酒店 | ¥{self.hotels:,.0f} |
| 🎫 景点门票 | ¥{self.attractions:,.0f} |
| 🍽️ 餐饮 | ¥{self.meals:,.0f} |
| 🚇 市内交通 | ¥{self.transport:,.0f} |
| 🛡️ 保险 | ¥{self.insurance:,.0f} |
| 🛍️ 杂费/购物 | ¥{self.misc:,.0f} |
| **💰 总计** | **¥{self.total:,.0f}** |"""


def calculate_budget(
    flights: list[FlightInfo],
    hotels: list[HotelInfo],
    attractions: list[AttractionInfo],
    days: int,
    travelers: int = 1,
    selected_flight_index: int = 0,
    selected_hotel_index: int = 0,
    selected_attraction_indices: list[int] | None = None,
) -> BudgetBreakdown:
    """根据搜索结果计算旅行预算明细

    Args:
        flights: 航班列表
        hotels: 酒店列表
        attractions: 景点列表
        days: 旅行天数
        travelers: 出行人数
        selected_flight_index: 选择的航班索引（默认第1个/最便宜）
        selected_hotel_index: 选择的酒店索引（默认第1个/最高评分）
        selected_attraction_indices: 选择的景点索引列表（默认全部，每天2-3个）

    Returns:
        BudgetBreakdown: 预算明细对象
    """
    # 机票（往返，每人）
    flight_cost = 0
    if flights and selected_flight_index < len(flights):
        flight_cost = flights[selected_flight_index]["price"] * 2 * travelers

    # 酒店（天数-1 晚，因为最后一天退房）
    hotel_cost = 0
    if hotels and selected_hotel_index < len(hotels):
        hotel_cost = hotels[selected_hotel_index]["price_per_night"] * (days - 1)

    # 景点门票
    attraction_cost = 0
    if selected_attraction_indices and attractions:
        for idx in selected_attraction_indices:
            if idx < len(attractions):
                attraction_cost += attractions[idx]["ticket_price"] * travelers
    else:
        # 默认：每天 2-3 个景点，取前 days*2 个
        count = min(len(attractions), days * 2)
        for a in attractions[:count]:
            attraction_cost += a["ticket_price"] * travelers

    # 餐饮
    meal_cost = MEAL_COST_PER_DAY * days * travelers

    # 市内交通
    transport_cost = TRANSPORT_COST_PER_DAY * days * travelers

    # 保险
    insurance_cost = INSURANCE_COST * travelers

    # 杂费
    misc_cost = MISC_COST_PER_DAY * days * travelers

    return BudgetBreakdown(
        flights=round(flight_cost, 2),
        hotels=round(hotel_cost, 2),
        attractions=round(attraction_cost, 2),
        meals=round(meal_cost, 2),
        transport=round(transport_cost, 2),
        insurance=round(insurance_cost, 2),
        misc=round(misc_cost, 2),
    )


def is_over_budget(budget: BudgetBreakdown, max_budget: float) -> tuple[bool, float]:
    """检查是否超预算，返回 (是否超预算, 超出金额)"""
    over = budget.total - max_budget
    return (over > 0, max(over, 0))
```

- [ ] **Step 2: 验证预算计算**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "
from app.tools.budget_calculator import calculate_budget
from app.tools.search_tools import search_flights, search_hotels, search_attractions

flights = search_flights('北京', '东京')
hotels = search_hotels('东京')
attractions = search_attractions('东京', ['美食', '文化'])

budget = calculate_budget(flights, hotels, attractions, days=5, travelers=1)
print('机票:', budget.flights)
print('酒店:', budget.hotels)
print('总计:', budget.total)
print('是否超10000:', budget.total > 10000)
"
```

Expected: 机票 6400, 酒店 2000, 总计 ~10000 左右

---

### Task 2: 创建行程模板构建器

**Files:**
- Create: `backend/app/tools/itinerary_builder.py`

- [ ] **Step 1: 创建 `backend/app/tools/itinerary_builder.py`**

```python
"""行程模板构建器 — 将搜索结果编排为结构化 DayPlan"""

from datetime import datetime, timedelta
from app.agents.state import (
    DayPlan,
    FlightInfo,
    HotelInfo,
    AttractionInfo,
)


def build_itinerary(
    flights: list[FlightInfo],
    hotels: list[HotelInfo],
    attractions: list[AttractionInfo],
    days: int,
    destination: str,
    start_date: str | None = None,
    selected_flight_index: int = 0,
    selected_hotel_index: int = 0,
) -> list[DayPlan]:
    """根据搜索结果构建每日行程

    Args:
        flights: 航班列表
        hotels: 酒店列表
        attractions: 景点列表
        days: 旅行天数
        destination: 目的地城市
        start_date: 出发日期（YYYY-MM-DD），默认明天
        selected_flight_index: 推荐航班索引
        selected_hotel_index: 推荐酒店索引

    Returns:
        list[DayPlan]: 每日行程列表
    """
    if start_date is None:
        start_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    # 选择推荐航班和酒店
    recommended_flight = flights[selected_flight_index] if flights and selected_flight_index < len(flights) else None
    recommended_hotel = hotels[selected_hotel_index]["name"] if hotels and selected_hotel_index < len(hotels) else "待定酒店"

    # 景点按类别分组，确保每天类别多样
    category_groups: dict[str, list[AttractionInfo]] = {}
    for attr in attractions:
        cat = attr["category"]
        if cat not in category_groups:
            category_groups[cat] = []
        category_groups[cat].append(attr)

    # 轮询分配景点到每天
    daily_attractions: list[list[AttractionInfo]] = [[] for _ in range(days)]
    all_attrs = list(attractions)
    day_idx = 0
    for attr in all_attrs:
        daily_attractions[day_idx % days].append(attr)
        day_idx += 1

    # 每天最多 3 个景点
    for i in range(days):
        daily_attractions[i] = daily_attractions[i][:3]

    # 三餐建议（按城市）
    MEAL_SUGGESTIONS = {
        "东京": [
            {"type": "早餐", "suggestion": "筑地市场寿司早餐 / 便利店日式饭团"},
            {"type": "午餐", "suggestion": "拉面店 / 天妇罗定食"},
            {"type": "晚餐", "suggestion": "居酒屋 / 烤肉放题"},
        ],
        "大阪": [
            {"type": "早餐", "suggestion": "大阪烧 / 便利店三明治"},
            {"type": "午餐", "suggestion": "道顿堀章鱼烧 / 炸串"},
            {"type": "晚餐", "suggestion": "河豚料理 / 寿喜烧"},
        ],
        "曼谷": [
            {"type": "早餐", "suggestion": "泰式炒粉 / 芒果糯米饭"},
            {"type": "午餐", "suggestion": "冬阴功汤 / 青咖喱"},
            {"type": "晚餐", "suggestion": "夜市小吃 / 海鲜烧烤"},
        ],
        "巴黎": [
            {"type": "早餐", "suggestion": "可颂+咖啡 / 法式薄饼"},
            {"type": "午餐", "suggestion": "法式三明治 / 沙拉"},
            {"type": "晚餐", "suggestion": "法餐三道式 / 红酒炖牛肉"},
        ],
    }

    default_meals = [
        {"type": "早餐", "suggestion": "当地特色早餐"},
        {"type": "午餐", "suggestion": "当地特色午餐"},
        {"type": "晚餐", "suggestion": "当地特色晚餐"},
    ]
    meals = MEAL_SUGGESTIONS.get(destination, default_meals)

    itinerary: list[DayPlan] = []

    for day in range(days):
        date = base_date + timedelta(days=day)
        date_str = date.strftime("%m月%d日")

        activities = []
        for attr in daily_attractions[day]:
            activities.append({
                "name": attr["name"],
                "time": "上午" if len(activities) == 0 else ("下午" if len(activities) == 1 else "傍晚"),
                "duration": attr["estimated_duration"],
                "notes": attr["description"],
                "category": attr["category"],
                "ticket_price": attr["ticket_price"],
            })

        # 第一天添加航班信息
        notes = ""
        if day == 0 and recommended_flight:
            notes = f"✈️ 推荐航班 {recommended_flight['airline']} {recommended_flight['flight_no']}，{recommended_flight['departure_time']}-{recommended_flight['arrival_time']}，¥{recommended_flight['price']}"

        itinerary.append(DayPlan(
            day=day + 1,
            date=f"Day {day + 1} ({date_str})",
            activities=activities,
            meals=meals,
            hotel=recommended_hotel,
            notes=notes,
        ))

    return itinerary


def itinerary_to_markdown(
    itinerary: list[DayPlan],
    destination: str,
    flight_info: dict | None = None,
    hotel_info: dict | None = None,
) -> str:
    """将行程转换为 Markdown 格式输出

    Args:
        itinerary: 行程列表
        destination: 目的地
        flight_info: 推荐航班信息
        hotel_info: 推荐酒店信息

    Returns:
        Markdown 格式的行程文本
    """
    lines = [f"# 🗺️ {destination} {len(itinerary)}天旅行行程\n"]

    if flight_info:
        lines.append("## ✈️ 推荐航班\n")
        lines.append(f"- **{flight_info['airline']} {flight_info['flight_no']}**")
        lines.append(f"- {flight_info['departure']} → {flight_info['arrival']}")
        lines.append(f"- {flight_info['departure_time']} - {flight_info['arrival_time']}")
        lines.append(f"- 票价: ¥{flight_info['price']}/人\n")

    if hotel_info:
        lines.append("## 🏨 推荐酒店\n")
        lines.append(f"- **{hotel_info['name']}** ⭐{hotel_info['rating']}")
        lines.append(f"- 地址: {hotel_info['address']}")
        lines.append(f"- 价格: ¥{hotel_info['price_per_night']}/晚")
        lines.append(f"- 亮点: {' | '.join(hotel_info['highlights'])}\n")

    lines.append("## 📅 每日行程\n")

    for plan in itinerary:
        lines.append(f"### {plan['date']}")
        lines.append(f"🏨 住宿: {plan['hotel']}")

        if plan["activities"]:
            lines.append("\n| 时段 | 景点 | 类别 | 时长 | 门票 | 说明 |")
            lines.append("|------|------|------|------|------|------|")
            for act in plan["activities"]:
                lines.append(
                    f"| {act['time']} | {act['name']} | {act['category']} | {act['duration']} | ¥{act['ticket_price']} | {act['notes'][:30]}... |"
                )
        else:
            lines.append("（自由安排）")

        lines.append(f"\n🍽️ 餐饮建议:")
        for meal in plan["meals"]:
            lines.append(f"- {meal['type']}: {meal['suggestion']}")

        if plan["notes"]:
            lines.append(f"\n💡 {plan['notes']}")

        lines.append("\n---\n")

    return "\n".join(lines)
```

- [ ] **Step 2: 验证行程构建**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "
from app.tools.itinerary_builder import build_itinerary, itinerary_to_markdown
from app.tools.search_tools import search_flights, search_hotels, search_attractions

flights = search_flights('北京', '东京')
hotels = search_hotels('东京')
attractions = search_attractions('东京', ['美食', '文化', '购物'])

itinerary = build_itinerary(flights, hotels, attractions, days=3, destination='东京')
print(f'行程天数: {len(itinerary)}')
for day in itinerary:
    print(f'Day {day[\"day\"]}: {len(day[\"activities\"])} 个景点, 酒店: {day[\"hotel\"]}')

md = itinerary_to_markdown(itinerary, '东京', flights[0] if flights else None, hotels[0] if hotels else None)
print(f'Markdown 长度: {len(md)} 字符')
"
```

Expected: 3 天行程，每天 1-2 个景点，Markdown 输出正常

---

### Task 3: 更新 summarize_node 整合预算和行程

**Files:**
- Modify: `backend/app/agents/planner_graph.py`

- [ ] **Step 1: 修改 imports**

在 `planner_graph.py` 顶部，在现有 imports 后添加：
```python
from app.tools.budget_calculator import calculate_budget
from app.tools.itinerary_builder import build_itinerary, itinerary_to_markdown
```

- [ ] **Step 2: 修改 summarize_node**

用以下代码替换整个 `summarize_node` 函数（第 266-305 行）：

```python
async def summarize_node(state: PlannerState) -> PlannerState:
    """汇总节点 — 结构化行程 + 预算计算 + LLM 润色"""
    llm = get_llm_client()
    client = llm.get_client()
    
    flights = state.get("flights", [])
    hotels = state.get("hotels", [])
    attractions = state.get("attractions", [])
    destination = state.get("destination", "")
    days = state.get("days", 5)
    travelers = state.get("travelers", 1)
    budget_limit = state.get("budget")
    
    # 1. 构建结构化行程
    itinerary = build_itinerary(
        flights=flights,
        hotels=hotels,
        attractions=attractions,
        days=days,
        destination=destination,
    )
    state["itinerary"] = itinerary
    
    # 2. 计算预算
    budget = calculate_budget(
        flights=flights,
        hotels=hotels,
        attractions=attractions,
        days=days,
        travelers=travelers,
    )
    state["total_budget_estimate"] = budget.total
    
    # 3. 生成 Markdown 行程文本
    flight_info = flights[0] if flights else None
    hotel_info = hotels[0] if hotels else None
    md_itinerary = itinerary_to_markdown(itinerary, destination, flight_info, hotel_info)
    md_budget = budget.to_markdown_table()
    
    # 4. LLM 生成行程总结
    context = f"""以下是根据搜索数据生成的旅行行程，请为这份行程写一个 100 字以内的旅行总结。

## 行程概览
- 目的地: {destination}
- 天数: {days} 天
- 景点数: {len(attractions)} 个
- 预算总计: ¥{budget.total:,.0f}

## 行程亮点
{chr(10).join([f"- Day {plan['day']}: {', '.join([a['name'] for a in plan['activities'][:2]])}" for plan in itinerary])}

请用热情、友好的语气写一段旅行总结，突出行程亮点。"""
    
    try:
        response = await client.chat.completions.create(
            model=llm.get_model(),
            messages=[
                {"role": "system", "content": "你是一个专业的旅行规划师，请为用户写一段简洁的行程总结。"},
                {"role": "user", "content": context}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        summary = response.choices[0].message.content or ""
    except Exception:
        summary = f"为您规划了 {destination} {days} 天旅行，精选 {len(attractions)} 个景点，总预算约 ¥{budget.total:,.0f}。"
    
    # 5. 组装最终输出
    final_output = f"{summary}\n\n{md_budget}\n\n{md_itinerary}"
    state["messages"] = [{"role": "assistant", "content": final_output}]
    
    return state
```

- [ ] **Step 3: 验证更新后的 summarize_node**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python -c "
import asyncio
from app.agents.planner_graph import search_node, summarize_node
from app.agents.state import PlannerState

async def test():
    state: PlannerState = {
        'messages': [],
        'destination': '东京', 'days': 3, 'budget': 10000,
        'preferences': ['美食', '文化'], 'departure_city': '北京',
        'travelers': 1, 'flights': None, 'hotels': None,
        'attractions': None, 'itinerary': None,
        'total_budget_estimate': None, 'next_step': None, 'error': None,
    }
    state = await search_node(state)
    print(f'搜索: {len(state[\"flights\"])}航班 {len(state[\"hotels\"])}酒店 {len(state[\"attractions\"])}景点')
    state = await summarize_node(state)
    print(f'行程: {len(state[\"itinerary\"])}天')
    print(f'预算: ¥{state[\"total_budget_estimate\"]:,.0f}')
    print(f'消息长度: {len(state[\"messages\"][-1][\"content\"])} 字符')

asyncio.run(test())
"
```

Expected: 3天行程，预算有数值，消息包含 markdown 表格和行程

---

### Task 4: 更新 API 路由返回结构化数据

**Files:**
- Modify: `backend/app/routers/trip.py`
- Modify: `backend/app/models/schemas.py`

- [ ] **Step 1: 在 schemas.py 中添加响应模型**

在 `backend/app/models/schemas.py` 末尾添加：

```python
class BudgetDetail(BaseModel):
    """预算明细"""
    flights: float = 0
    hotels: float = 0
    attractions: float = 0
    meals: float = 0
    transport: float = 0
    insurance: float = 0
    misc: float = 0
    total: float = 0


class ActivityItem(BaseModel):
    """景点活动"""
    name: str
    time: str
    duration: str
    notes: str
    category: str = ""
    ticket_price: float = 0


class MealItem(BaseModel):
    """餐饮建议"""
    type: str
    suggestion: str


class DayPlanResponse(BaseModel):
    """每日行程"""
    day: int
    date: str
    activities: list[ActivityItem] = []
    meals: list[MealItem] = []
    hotel: str = ""
    notes: str = ""


class TripPlanResponse(BaseModel):
    """旅行规划完整响应"""
    destination: str
    days: int
    budget: BudgetDetail
    itinerary: list[DayPlanResponse] = []
    summary: str = ""
    markdown: str = ""
```

- [ ] **Step 2: 修改 trip.py 的 _stream_plan 函数**

修改 `backend/app/routers/trip.py`，在 `_stream_plan` 函数中，`summarize_node` 完成后，添加结构化数据的 SSE 事件：

在 `state = await summarize_node(state)` 之后，`content = ...` 之前，添加：

```python
        # 发送结构化行程数据
        import json as json_module
        itinerary_data = state.get("itinerary", [])
        budget_data = budget.to_dict() if 'budget' in dir() else {}
        
        yield f"data: {json_module.dumps({'status': 'structured_data', 'itinerary': itinerary_data, 'budget': budget_data}, ensure_ascii=False, default=str)}\n\n"
```

注意：需要调整 `_stream_plan` 函数，将 `budget` 的计算提前。修改后的完整 `_stream_plan` 函数：

```python
async def _stream_plan(state: PlannerState):
    """流式执行 Agent 工作流并推送进度"""
    try:
        yield f"data: {json.dumps({'status': 'start', 'message': '开始规划旅行...'}, ensure_ascii=False)}\n\n"
        
        yield f"data: {json.dumps({'status': 'searching', 'message': '正在搜索航班、酒店和景点信息...'}, ensure_ascii=False)}\n\n"
        
        from app.agents.planner_graph import search_node, summarize_node
        from app.tools.budget_calculator import calculate_budget
        from app.tools.itinerary_builder import build_itinerary
        
        # 搜索
        state = await search_node(state)
        yield f"data: {json.dumps({'status': 'searched', 'message': f'找到 {len(state.get("flights", []))} 个航班、{len(state.get("hotels", []))} 家酒店、{len(state.get("attractions", []))} 个景点'}, ensure_ascii=False)}\n\n"
        
        # 生成行程
        yield f"data: {json.dumps({'status': 'generating', 'message': '正在生成行程方案...'}, ensure_ascii=False)}\n\n"
        
        state = await summarize_node(state)
        
        # 发送结构化数据
        if state.get("itinerary"):
            yield f"data: {json.dumps({'status': 'itinerary', 'data': state['itinerary']}, ensure_ascii=False, default=str)}\n\n"
        
        if state.get("total_budget_estimate"):
            yield f"data: {json.dumps({'status': 'budget', 'total': state['total_budget_estimate']}, ensure_ascii=False)}\n\n"
        
        # 发送最终文本
        content = state["messages"][-1]["content"] if state.get("messages") else "行程生成失败"
        yield f"data: {json.dumps({'status': 'done', 'content': content}, ensure_ascii=False)}\n\n"
        
        yield f"data: {json.dumps({'done': True})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'status': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
```

---

### Task 5: 前端行程卡片组件

**Files:**
- Create: `frontend/src/components/ItineraryCard.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 `frontend/src/components/ItineraryCard.tsx`**

```tsx
import ReactMarkdown from 'react-markdown'

interface BudgetData {
  total: number
}

interface ItineraryCardProps {
  content: string
  budget?: BudgetData | null
}

export default function ItineraryCard({ content, budget }: ItineraryCardProps) {
  return (
    <div className="message-content text-sm leading-relaxed">
      {budget && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-500 font-medium mb-1">💰 预算估算</div>
          <div className="text-2xl font-bold text-blue-600">¥{budget.total.toLocaleString()}</div>
        </div>
      )}
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 2: 修改 App.tsx 使用 ItineraryCard**

在 `App.tsx` 中：
1. 添加 import: `import ItineraryCard from './components/ItineraryCard'`
2. 在 `handleQuickPlan` 的 SSE 解析中，保存 budget 数据
3. 在 MessageBubble 中或在 App 中根据消息类型使用 ItineraryCard

实际上，简化方案：修改 `MessageBubble.tsx`，当消息内容包含预算表格时，前置一个预算卡片。

修改 `MessageBubble.tsx`：

```tsx
import { type Message } from '../App'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  budget?: number | null
}

export default function MessageBubble({ message, budget }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
        }`}
      >
        <div className={`text-xs mb-1 font-medium ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {isUser ? '你' : '✈️ 旅行规划师'}
        </div>

        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="message-content text-sm leading-relaxed">
            {budget && (
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <div className="text-xs text-blue-400 font-medium mb-1">💰 预算估算</div>
                <div className="text-2xl font-bold text-blue-600">¥{budget.toLocaleString()}</div>
              </div>
            )}
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
```

在 `App.tsx` 中，给 `handleQuickPlan` 添加 budget 状态追踪：

在 `handleQuickPlan` 函数开头添加：
```tsx
let tripBudget: number | null = null
```

在 SSE 解析的 `parsed.status === "budget"` 分支中：
```tsx
} else if (parsed.status === "budget" && parsed.total) {
  tripBudget = parsed.total
```

然后需要将 budget 传递给 MessageBubble。为了简化，我们将 budget 存储在消息的扩展字段中：

由于 Message 接口不方便改，我们直接在 `handleQuickPlan` 的 `done` 状态时，将 budget 信息追加到 content 前缀中（作为隐藏标记），或者建立一个 messageId -> budget 的映射。

**最简方案**：在 `handleQuickPlan` 的 `done` 回调中，将 budget 直接拼到 content 前面作为 HTML 注释，MessageBubble 不感知。这样就无需改动 MessageBubble，只需在 SSE 解析时收集 budget 值。

实际上，App.tsx 中的 handleQuickPlan 已经是内联的，直接修改 SSE 解析逻辑即可：当收到 budget 数据时，保存到局部变量；当收到 done 时，将 budget 信息前置到 content 中。

```tsx
// 在 handleQuickPlan 中，声明 budget 变量
let tripBudget: number | null = null

// 在 SSE 解析循环中，添加 budget 处理：
} else if (parsed.status === "budget" && parsed.total) {
  tripBudget = parsed.total
}

// 在 done 时，将 budget 拼入 content：
} else if (parsed.status === "done" && parsed.content) {
  const finalContent = tripBudget 
    ? `💰 **预算总计: ¥${tripBudget.toLocaleString()}**\n\n---\n\n${parsed.content}`
    : parsed.content
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantMsg.id
        ? { ...m, content: finalContent }
        : m
    )
  )
}
```

这样改动最小，只需在 App.tsx 中加几行代码。

---

### Task 6: 验证联调

- [ ] **Step 1: 运行完整测试**

```powershell
cd c:\Users\天选\Documents\trae_projects\ai项目\backend
$env:PYTHONPATH = "$PWD\lib"
python test_agent.py
```

Expected: 搜索正常，行程有结构化数据，预算有数值

- [ ] **Step 2: 重启后端并测试 API**

```powershell
$env:PYTHONPATH = "$PWD\lib"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/health -UseBasicParsing
```

Expected: 200 OK

---

## 完成标志

- [ ] budget_calculator.py 创建并验证
- [ ] itinerary_builder.py 创建并验证
- [ ] summarize_node 整合预算和行程
- [ ] API 返回结构化数据
- [ ] 前端展示预算卡片
- [ ] 端到端测试通过