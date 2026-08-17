# Phase 2: Agent 核心实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现多 Agent 协作的旅行规划核心：定义工具函数、构建 LangGraph StateGraph、让 Planner Agent 能调用子 Agent 获取真实数据并生成结构化行程。

**Architecture:** 采用 LangGraph 的 StateGraph 编排多 Agent 协作。Planner Agent 作为主控，理解用户需求后拆解为子任务，分发给 Flight/Hotel/Attraction 三个子 Agent 并行执行。子 Agent 调用工具函数（mock 数据），结果汇总后由 Planner Agent 生成最终行程。

**Tech Stack:** LangGraph, OpenAI Function Calling, Pydantic, FastAPI

---

### Task 1: 安装 LangGraph 依赖并创建工具目录

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/app/agents/__init__.py`
- Create: `backend/app/tools/__init__.py`

- [ ] **Step 1: 添加 langgraph 依赖**

```bash
pip install --target ./lib langgraph>=0.2.0
```

- [ ] **Step 2: 创建 agents 和 tools 目录**

```bash
New-Item -ItemType Directory -Force -Path "backend/app/agents", "backend/app/tools"
```

- [ ] **Step 3: 创建空 __init__.py**

```python
# backend/app/agents/__init__.py
```

```python
# backend/app/tools/__init__.py
```

- [ ] **Step 4: 更新 requirements.txt**

编辑 `backend/requirements.txt`，在末尾追加：
```
langgraph>=0.2.0
```

- [ ] **Step 5: 验证安装**

```bash
$env:PYTHONPATH = "$PWD\lib"; python -c "from langgraph.graph import StateGraph; print('LangGraph OK')"
```

Expected: `LangGraph OK`

---

### Task 2: 定义 Agent 状态和工具函数

**Files:**
- Create: `backend/app/agents/state.py`
- Create: `backend/app/tools/search_tools.py`

- [ ] **Step 1: 创建 Agent 状态定义 `backend/app/agents/state.py`**

```python
"""Agent 状态定义"""

from typing import TypedDict, Optional, Annotated
from langgraph.graph.message import add_messages


class FlightInfo(TypedDict):
    airline: str
    flight_no: str
    departure: str
    arrival: str
    departure_time: str
    arrival_time: str
    price: float


class HotelInfo(TypedDict):
    name: str
    city: str
    rating: float
    price_per_night: float
    address: str
    highlights: list[str]


class AttractionInfo(TypedDict):
    name: str
    city: str
    category: str       # 自然/文化/美食/购物/娱乐
    estimated_duration: str  # 建议游玩时长
    ticket_price: float
    description: str


class DayPlan(TypedDict):
    day: int
    date: str
    activities: list[dict]
    meals: list[str]
    hotel: str
    notes: str


class PlannerState(TypedDict):
    """Planner Agent 的全局状态"""
    messages: Annotated[list, add_messages]  # 对话历史
    destination: Optional[str]               # 目的地
    days: Optional[int]                      # 天数
    budget: Optional[float]                  # 预算
    preferences: Optional[list[str]]         # 偏好
    departure_city: Optional[str]            # 出发城市
    travelers: Optional[int]                 # 出行人数
    
    # 搜索结果
    flights: Optional[list[FlightInfo]]
    hotels: Optional[list[HotelInfo]]
    attractions: Optional[list[AttractionInfo]]
    
    # 最终行程
    itinerary: Optional[list[DayPlan]]
    total_budget_estimate: Optional[float]
    
    # 控制流
    next_step: Optional[str]  # 下一步动作
    error: Optional[str]      # 错误信息
```

- [ ] **Step 2: 创建工具函数 `backend/app/tools/search_tools.py`**

```python
"""旅行搜索工具函数 — 当前为 mock 数据，后续接入真实 API"""

import random
from app.agents.state import FlightInfo, HotelInfo, AttractionInfo


# ============ Mock 数据库 ============

MOCK_FLIGHTS = {
    ("北京", "东京"): [
        {"airline": "中国国航", "flight_no": "CA925", "departure_time": "08:30", "arrival_time": "12:30", "price": 3200},
        {"airline": "全日空", "flight_no": "NH964", "departure_time": "10:00", "arrival_time": "14:00", "price": 3800},
        {"airline": "日本航空", "flight_no": "JL022", "departure_time": "13:00", "arrival_time": "17:00", "price": 3500},
    ],
    ("上海", "东京"): [
        {"airline": "东方航空", "flight_no": "MU523", "departure_time": "09:00", "arrival_time": "12:30", "price": 2800},
        {"airline": "全日空", "flight_no": "NH972", "departure_time": "11:30", "arrival_time": "15:00", "price": 3500},
        {"airline": "春秋航空", "flight_no": "9C8888", "departure_time": "07:00", "arrival_time": "11:00", "price": 1500},
    ],
    ("北京", "大阪"): [
        {"airline": "中国国航", "flight_no": "CA927", "departure_time": "09:00", "arrival_time": "12:30", "price": 3400},
        {"airline": "东方航空", "flight_no": "MU747", "departure_time": "10:30", "arrival_time": "14:00", "price": 3100},
    ],
    ("上海", "大阪"): [
        {"airline": "春秋航空", "flight_no": "9C8589", "departure_time": "08:00", "arrival_time": "11:00", "price": 1200},
        {"airline": "吉祥航空", "flight_no": "HO1337", "departure_time": "14:00", "arrival_time": "17:00", "price": 1800},
    ],
    ("北京", "曼谷"): [
        {"airline": "泰国航空", "flight_no": "TG675", "departure_time": "17:00", "arrival_time": "21:00", "price": 2500},
        {"airline": "中国国航", "flight_no": "CA979", "departure_time": "13:00", "arrival_time": "17:00", "price": 2800},
    ],
}

MOCK_HOTELS = {
    "东京": [
        {"name": "新宿格拉斯丽酒店", "rating": 4.3, "price_per_night": 800, "address": "新宿区歌舞伎町1-19-1", "highlights": ["近地铁", "哥斯拉主题", "夜景"]},
        {"name": "浅草雷门酒店", "rating": 4.1, "price_per_night": 500, "address": "台东区浅草2-3-1", "highlights": ["近浅草寺", "传统日式", "性价比"]},
        {"name": "东京半岛酒店", "rating": 4.8, "price_per_night": 2500, "address": "千代田区丸之内1-8-1", "highlights": ["奢华", "银座旁", "米其林餐厅"]},
        {"name": "上野撒库拉酒店", "rating": 3.9, "price_per_night": 350, "address": "台东区上野3-20-1", "highlights": ["近上野公园", "经济型", "安静"]},
    ],
    "大阪": [
        {"name": "心斋桥格兰多酒店", "rating": 4.2, "price_per_night": 600, "address": "中央区心斋桥筋2-2-1", "highlights": ["购物便利", "道顿堀旁"]},
        {"name": "大阪万豪都酒店", "rating": 4.7, "price_per_night": 1800, "address": "阿倍野区阿倍野筋1-1-43", "highlights": ["高空景观", "豪华"]},
        {"name": "天王寺经济酒店", "rating": 3.8, "price_per_night": 300, "address": "天王寺区悲田院町3-16", "highlights": ["近JR站", "经济实惠"]},
    ],
    "曼谷": [
        {"name": "曼谷暹罗凯宾斯基酒店", "rating": 4.6, "price_per_night": 900, "address": "991/9 Rama I Rd", "highlights": ["暹罗商圈", "泳池"]},
        {"name": "考山路背包客栈", "rating": 3.5, "price_per_night": 150, "address": "68 Khaosan Rd", "highlights": ["背包客天堂", "夜市"]},
    ],
    "巴黎": [
        {"name": "巴黎星辰艾美酒店", "rating": 4.4, "price_per_night": 1200, "address": "81 Bd Gouvion Saint-Cyr", "highlights": ["近凯旋门", "法式风情"]},
        {"name": "蒙马特艺术酒店", "rating": 4.0, "price_per_night": 600, "address": "16 Rue Tholozé", "highlights": ["艺术家区", "圣心堂旁"]},
    ],
}

MOCK_ATTRACTIONS = {
    "东京": [
        {"name": "浅草寺", "category": "文化", "estimated_duration": "2小时", "ticket_price": 0, "description": "东京最古老的寺庙，雷门大灯笼是标志"},
        {"name": "秋叶原", "category": "购物", "estimated_duration": "3小时", "ticket_price": 0, "description": "电器街与动漫文化中心，二次元天堂"},
        {"name": "筑地市场", "category": "美食", "estimated_duration": "2小时", "ticket_price": 0, "description": "新鲜海鲜和寿司，建议早上前往"},
        {"name": "涩谷十字路口", "category": "购物", "estimated_duration": "1小时", "ticket_price": 0, "description": "世界最繁忙的十字路口，年轻人的聚集地"},
        {"name": "东京迪士尼乐园", "category": "娱乐", "estimated_duration": "全天", "ticket_price": 490, "description": "亚洲最受欢迎的主题乐园之一"},
        {"name": "明治神宫", "category": "文化", "estimated_duration": "1.5小时", "ticket_price": 0, "description": "位于原宿的幽静神社，城市中的森林"},
        {"name": "新宿御苑", "category": "自然", "estimated_duration": "2小时", "ticket_price": 15, "description": "日式庭园与法式庭园结合的皇家花园"},
        {"name": "银座", "category": "购物", "estimated_duration": "3小时", "ticket_price": 0, "description": "东京顶级购物区，奢侈品与百货林立"},
    ],
    "大阪": [
        {"name": "大阪城", "category": "文化", "estimated_duration": "2.5小时", "ticket_price": 40, "description": "日本三大名城之一，天守阁可眺望市景"},
        {"name": "道顿堀", "category": "美食", "estimated_duration": "2小时", "ticket_price": 0, "description": "美食天堂，章鱼烧和螃蟹招牌是标志"},
        {"name": "环球影城", "category": "娱乐", "estimated_duration": "全天", "ticket_price": 520, "description": "超级任天堂世界和哈利波特园区"},
        {"name": "心斋桥", "category": "购物", "estimated_duration": "3小时", "ticket_price": 0, "description": "大阪最繁华的购物街"},
        {"name": "通天阁", "category": "文化", "estimated_duration": "1小时", "ticket_price": 45, "description": "大阪地标，新世界区域的象征"},
    ],
    "曼谷": [
        {"name": "大皇宫", "category": "文化", "estimated_duration": "2.5小时", "ticket_price": 100, "description": "泰国最著名的地标，玉佛寺所在地"},
        {"name": "恰图恰周末市场", "category": "购物", "estimated_duration": "4小时", "ticket_price": 0, "description": "世界最大的周末市场，8000+摊位"},
        {"name": "考山路", "category": "美食", "estimated_duration": "2小时", "ticket_price": 0, "description": "背包客天堂，夜市小吃和酒吧"},
        {"name": "卧佛寺", "category": "文化", "estimated_duration": "1.5小时", "ticket_price": 60, "description": "46米长的卧佛，泰国传统按摩发源地"},
    ],
    "巴黎": [
        {"name": "埃菲尔铁塔", "category": "文化", "estimated_duration": "2小时", "ticket_price": 150, "description": "巴黎象征，登顶俯瞰全城"},
        {"name": "卢浮宫", "category": "文化", "estimated_duration": "4小时", "ticket_price": 120, "description": "世界最大博物馆，《蒙娜丽莎》所在地"},
        {"name": "香榭丽舍大街", "category": "购物", "estimated_duration": "2小时", "ticket_price": 0, "description": "巴黎最美大道，凯旋门至协和广场"},
        {"name": "蒙马特高地", "category": "文化", "estimated_duration": "2小时", "ticket_price": 0, "description": "圣心大教堂和艺术家广场"},
    ],
}


# ============ 工具函数 ============

def search_flights(
    departure: str,
    destination: str,
    budget: float | None = None
) -> list[FlightInfo]:
    """搜索航班信息
    
    Args:
        departure: 出发城市，如 "北京"、"上海"
        destination: 目的地城市，如 "东京"、"大阪"
        budget: 预算上限（元），可选
    
    Returns:
        航班列表，按价格升序
    """
    key = (departure, destination)
    flights = MOCK_FLIGHTS.get(key, [])
    
    if not flights:
        # 如果没有直飞，返回一个通用航班
        flights = [{
            "airline": "通用航空",
            "flight_no": f"GA{random.randint(1000,9999)}",
            "departure_time": "10:00",
            "arrival_time": "14:00",
            "price": 3000,
        }]
    
    result = []
    for f in flights:
        if budget is None or f["price"] <= budget / 3:  # 机票不超过预算1/3
            result.append(FlightInfo(
                airline=f["airline"],
                flight_no=f["flight_no"],
                departure=departure,
                arrival=destination,
                departure_time=f["departure_time"],
                arrival_time=f["arrival_time"],
                price=f["price"],
            ))
    
    return sorted(result, key=lambda x: x["price"])


def search_hotels(
    city: str,
    budget_per_night: float | None = None,
    min_rating: float = 3.5
) -> list[HotelInfo]:
    """搜索酒店信息
    
    Args:
        city: 城市名
        budget_per_night: 每晚预算上限
        min_rating: 最低评分
    
    Returns:
        酒店列表，按评分降序
    """
    hotels = MOCK_HOTELS.get(city, [])
    
    if not hotels:
        hotels = [{
            "name": f"{city}中心酒店",
            "rating": 4.0,
            "price_per_night": 500,
            "address": f"{city}市中心",
            "highlights": ["位置便利"],
        }]
    
    result = []
    for h in hotels:
        if h["rating"] >= min_rating:
            if budget_per_night is None or h["price_per_night"] <= budget_per_night:
                result.append(HotelInfo(
                    name=h["name"],
                    city=city,
                    rating=h["rating"],
                    price_per_night=h["price_per_night"],
                    address=h["address"],
                    highlights=h["highlights"],
                ))
    
    return sorted(result, key=lambda x: x["rating"], reverse=True)


def search_attractions(
    city: str,
    preferences: list[str] | None = None
) -> list[AttractionInfo]:
    """搜索景点信息
    
    Args:
        city: 城市名
        preferences: 偏好标签，如 ["美食", "文化", "自然"]
    
    Returns:
        景点列表
    """
    attractions = MOCK_ATTRACTIONS.get(city, [])
    
    if not attractions:
        attractions = [{
            "name": f"{city}城市观光",
            "category": "文化",
            "estimated_duration": "3小时",
            "ticket_price": 50,
            "description": f"探索{city}的魅力",
        }]
    
    result = []
    for a in attractions:
        if preferences is None or a["category"] in preferences:
            result.append(AttractionInfo(
                name=a["name"],
                city=city,
                category=a["category"],
                estimated_duration=a["estimated_duration"],
                ticket_price=a["ticket_price"],
                description=a["description"],
            ))
    
    return result
```

- [ ] **Step 3: 验证工具函数**

```bash
$env:PYTHONPATH = "$PWD\lib"; python -c "from app.tools.search_tools import search_flights, search_hotels, search_attractions; print('Flights:', len(search_flights('北京','东京'))); print('Hotels:', len(search_hotels('东京'))); print('Attractions:', len(search_attractions('东京', ['美食'])))"
```

Expected: Flights: 3, Hotels: 4, Attractions: 1

---

### Task 3: 实现 Agent 节点和 LangGraph 工作流

**Files:**
- Create: `backend/app/agents/planner_graph.py`

- [ ] **Step 1: 创建 `backend/app/agents/planner_graph.py`**

```python
"""Planner Agent — LangGraph 工作流"""

import json
from typing import Literal
from langgraph.graph import StateGraph, END
from app.agents.state import PlannerState, FlightInfo, HotelInfo, AttractionInfo, DayPlan
from app.tools.search_tools import search_flights, search_hotels, search_attractions
from app.core.llm import get_llm_client


# ============ 工具定义（供 LLM Function Calling） ============

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": "搜索航班信息，返回可选航班列表（含航司、时间、价格）",
            "parameters": {
                "type": "object",
                "properties": {
                    "departure": {"type": "string", "description": "出发城市，如 北京、上海"},
                    "destination": {"type": "string", "description": "目的地城市，如 东京、大阪"},
                    "budget": {"type": "number", "description": "往返机票预算上限（元），可选"}
                },
                "required": ["departure", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": "搜索目的地酒店，返回酒店列表（含名称、评分、价格、地址）",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名"},
                    "budget_per_night": {"type": "number", "description": "每晚预算上限（元），可选"},
                    "min_rating": {"type": "number", "description": "最低评分，默认3.5"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_attractions",
            "description": "搜索目的地景点和活动，返回景点列表（含类别、建议时长、门票价格）",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名"},
                    "preferences": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "偏好筛选，可选值：文化、美食、购物、自然、娱乐"
                    }
                },
                "required": ["city"]
            }
        }
    }
]

# 工具函数映射
TOOL_MAP = {
    "search_flights": search_flights,
    "search_hotels": search_hotels,
    "search_attractions": search_attractions,
}


# ============ Agent 节点 ============

PLANNER_SYSTEM_PROMPT = """你是一个专业的旅行规划 Agent。你的任务是根据用户需求，调用工具获取真实数据，然后生成详细的旅行行程。

## 工作流程
1. 分析用户需求，提取：目的地、天数、预算、偏好、出发城市
2. 调用 search_flights 获取航班信息
3. 调用 search_hotels 获取酒店信息
4. 调用 search_attractions 获取景点信息
5. 汇总所有数据，生成每日行程计划

## 行程生成规则
- 每天安排 2-3 个景点，避免过于紧凑
- 考虑景点地理位置，相近的排在同一天
- 景点类别多样化（文化/美食/购物/自然/娱乐）
- 每天安排早中晚三餐建议
- 标注每天的住宿酒店

## 输出格式
当所有数据收集完毕后，用 JSON 格式输出最终行程：
```json
{
  "itinerary": [
    {
      "day": 1,
      "date": "Day 1",
      "activities": [{"name": "景点名", "time": "建议时段", "duration": "时长", "notes": "贴士"}],
      "meals": [{"type": "早餐", "suggestion": "推荐"}],
      "hotel": "酒店名",
      "notes": "当天注意事项"
    }
  ],
  "total_budget": {
    "flights": 0,
    "hotels": 0,
    "attractions": 0,
    "meals": 0,
    "total": 0
  },
  "summary": "行程总结（100字以内）"
}
```

请逐步执行，每步告诉用户你在做什么。"""


async def planner_node(state: PlannerState) -> PlannerState:
    """主控 Planner Agent — 分析需求、调用工具、生成行程"""
    llm = get_llm_client()
    client = llm.get_client()
    
    messages = [{"role": "system", "content": PLANNER_SYSTEM_PROMPT}]
    
    # 添加用户消息
    if state.get("messages"):
        messages.extend(state["messages"])
    
    # 提取用户需求信息
    user_context = "当前已知信息：\n"
    if state.get("destination"):
        user_context += f"- 目的地: {state['destination']}\n"
    if state.get("days"):
        user_context += f"- 天数: {state['days']}天\n"
    if state.get("budget"):
        user_context += f"- 预算: {state['budget']}元\n"
    if state.get("preferences"):
        user_context += f"- 偏好: {', '.join(state['preferences'])}\n"
    if state.get("departure_city"):
        user_context += f"- 出发城市: {state['departure_city']}\n"
    
    # 检查是否已有搜索结果
    has_data = False
    if state.get("flights"):
        user_context += "\n已获取航班数据：\n" + json.dumps(state["flights"], ensure_ascii=False, indent=2)
        has_data = True
    if state.get("hotels"):
        user_context += "\n已获取酒店数据：\n" + json.dumps(state["hotels"], ensure_ascii=False, indent=2)
        has_data = True
    if state.get("attractions"):
        user_context += "\n已获取景点数据：\n" + json.dumps(state["attractions"], ensure_ascii=False, indent=2)
        has_data = True
    
    if has_data:
        user_context += "\n请基于以上数据，生成完整的 JSON 格式行程。"
    else:
        user_context += "\n请开始调用工具搜索数据。先搜航班、再搜酒店、最后搜景点。"
    
    messages.append({"role": "user", "content": user_context})
    
    # 调用 LLM（带工具）
    response = await client.chat.completions.create(
        model=llm.get_model(),
        messages=messages,
        tools=TOOLS,
        tool_choice="auto" if not has_data else "none",
        temperature=0.7,
        max_tokens=4096,
    )
    
    msg = response.choices[0].message
    
    # 处理工具调用
    if msg.tool_calls:
        tool_results = []
        for tool_call in msg.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)
            
            if func_name in TOOL_MAP:
                result = TOOL_MAP[func_name](**func_args)
                tool_results.append({
                    "tool": func_name,
                    "args": func_args,
                    "result": result
                })
                
                # 更新状态
                if func_name == "search_flights":
                    state["flights"] = result
                elif func_name == "search_hotels":
                    state["hotels"] = result
                elif func_name == "search_attractions":
                    state["attractions"] = result
        
        # 将工具结果添加到消息中
        messages.append({"role": "assistant", "content": None, "tool_calls": [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments}
            }
            for tc in msg.tool_calls
        ]})
        
        for tr in tool_results:
            messages.append({
                "role": "tool",
                "tool_call_id": msg.tool_calls[0].id,
                "content": json.dumps(tr["result"], ensure_ascii=False)
            })
        
        # 递归调用 LLM 继续处理
        follow_up = await client.chat.completions.create(
            model=llm.get_model(),
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
        )
        state["messages"] = [{"role": "assistant", "content": follow_up.choices[0].message.content or ""}]
    else:
        state["messages"] = [{"role": "assistant", "content": msg.content or ""}]
    
    return state


def route_after_planner(state: PlannerState) -> Literal["search_node", "summarize_node", END]:
    """路由决策：是否需要继续搜索或生成摘要"""
    # 如果已有完整数据，进入摘要节点
    if state.get("flights") and state.get("hotels") and state.get("attractions"):
        return "summarize_node"
    # 如果还没有数据，继续搜索
    if not state.get("flights") or not state.get("hotels") or not state.get("attractions"):
        return "search_node"
    return END


async def search_node(state: PlannerState) -> PlannerState:
    """统一搜索节点 — 并行搜索航班、酒店、景点"""
    destination = state.get("destination", "东京")
    departure = state.get("departure_city", "北京")
    budget = state.get("budget")
    preferences = state.get("preferences")
    days = state.get("days", 5)
    
    # 搜索航班
    if not state.get("flights"):
        flight_budget = budget / 3 if budget else None
        state["flights"] = search_flights(departure, destination, flight_budget)
    
    # 搜索酒店
    if not state.get("hotels"):
        hotel_budget = budget / (days * 2) if budget else None
        state["hotels"] = search_hotels(destination, hotel_budget)
    
    # 搜索景点
    if not state.get("attractions"):
        state["attractions"] = search_attractions(destination, preferences)
    
    return state


async def summarize_node(state: PlannerState) -> PlannerState:
    """汇总节点 — 将搜索结果交给 LLM 生成最终行程"""
    llm = get_llm_client()
    client = llm.get_client()
    
    context = f"""请基于以下真实数据，生成一份 {state.get('days', 5)} 天的 {state.get('destination', '')} 旅行行程。

## 航班选项
{json.dumps(state.get('flights', []), ensure_ascii=False, indent=2)}

## 酒店选项
{json.dumps(state.get('hotels', []), ensure_ascii=False, indent=2)}

## 景点选项
{json.dumps(state.get('attractions', []), ensure_ascii=False, indent=2)}

## 用户偏好
- 预算: {state.get('budget', '不限')}元
- 偏好: {', '.join(state.get('preferences', ['综合']))}

## 要求
1. 生成 {state.get('days', 5)} 天的详细行程
2. 每天安排 2-3 个景点，合理搭配类别
3. 推荐航班和酒店（标注价格）
4. 计算总预算
5. 用 markdown 格式输出，方便阅读
"""
    
    response = await client.chat.completions.create(
        model=llm.get_model(),
        messages=[
            {"role": "system", "content": "你是一个专业的旅行规划师。请根据提供的真实数据生成详细行程。"},
            {"role": "user", "content": context}
        ],
        temperature=0.7,
        max_tokens=4096,
    )
    
    state["messages"] = [{"role": "assistant", "content": response.choices[0].message.content or ""}]
    return state


# ============ 构建 Graph ============

def create_planner_graph() -> StateGraph:
    """创建旅行规划 Agent 工作流"""
    workflow = StateGraph(PlannerState)
    
    # 添加节点
    workflow.add_node("planner_node", planner_node)
    workflow.add_node("search_node", search_node)
    workflow.add_node("summarize_node", summarize_node)
    
    # 设置入口
    workflow.set_entry_point("planner_node")
    
    # 添加边
    workflow.add_conditional_edges(
        "planner_node",
        route_after_planner,
        {
            "search_node": "search_node",
            "summarize_node": "summarize_node",
            END: END,
        }
    )
    
    # 搜索完成后回到 planner 继续
    workflow.add_edge("search_node", "planner_node")
    
    # 摘要完成后结束
    workflow.add_edge("summarize_node", END)
    
    return workflow.compile()


# 全局 graph 实例
planner_graph = create_planner_graph()
```

- [ ] **Step 2: 验证 Graph 编译**

```bash
$env:PYTHONPATH = "$PWD\lib"; python -c "from app.agents.planner_graph import planner_graph; print('Graph compiled OK, nodes:', list(planner_graph.nodes.keys()))"
```

Expected: Graph compiled OK, nodes: ['planner_node', 'search_node', 'summarize_node']

---

### Task 4: 创建旅行规划 API 路由

**Files:**
- Create: `backend/app/routers/trip.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 创建 `backend/app/routers/trip.py`**

```python
"""旅行规划路由 — 支持流式 Agent 输出"""

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import TripPlanRequest
from app.agents.planner_graph import planner_graph
from app.agents.state import PlannerState

router = APIRouter(prefix="/api/trip", tags=["trip"])


@router.post("/plan")
async def plan_trip(request: TripPlanRequest):
    """生成旅行规划
    
    通过 Agent 工作流搜索航班、酒店、景点，生成结构化行程。
    支持 SSE 流式输出每一步的进度。
    """
    initial_state: PlannerState = {
        "messages": [
            {"role": "user", "content": f"请帮我规划一次{request.destination}的{request.days}天旅行。预算{request.budget or '不限'}元。偏好：{', '.join(request.preferences) if request.preferences else '综合'}。出发城市：{request.departure or '北京'}。"}
        ],
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
    
    return StreamingResponse(
        _stream_plan(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _stream_plan(state: PlannerState):
    """流式执行 Agent 工作流并推送进度"""
    try:
        yield f"data: {json.dumps({'status': 'start', 'message': '开始规划旅行...'}, ensure_ascii=False)}\n\n"
        
        # 执行搜索节点
        yield f"data: {json.dumps({'status': 'searching', 'message': '正在搜索航班、酒店和景点信息...'}, ensure_ascii=False)}\n\n"
        
        # 手动执行节点（因为 LangGraph 的 astream 在异步模式下需要特殊处理）
        from app.agents.planner_graph import search_node, summarize_node
        
        state = await search_node(state)
        yield f"data: {json.dumps({'status': 'searched', 'message': f'找到 {len(state.get("flights", []))} 个航班、{len(state.get("hotels", []))} 家酒店、{len(state.get("attractions", []))} 个景点'}, ensure_ascii=False)}\n\n"
        
        # 生成摘要
        yield f"data: {json.dumps({'status': 'generating', 'message': '正在生成行程方案...'}, ensure_ascii=False)}\n\n"
        
        state = await summarize_node(state)
        
        # 发送最终行程
        content = state["messages"][-1]["content"] if state.get("messages") else "行程生成失败"
        yield f"data: {json.dumps({'status': 'done', 'content': content}, ensure_ascii=False)}\n\n"
        
        yield f"data: {json.dumps({'done': True})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'status': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"


@router.get("/plan/stream")
async def plan_trip_stream(request: TripPlanRequest):
    """通过 LangGraph 的 astream 流式输出规划过程"""
    initial_state: PlannerState = {
        "messages": [
            {"role": "user", "content": f"请帮我规划一次{request.destination}的{request.days}天旅行。"}
        ],
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
    
    return StreamingResponse(
        _stream_graph(initial_state),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


async def _stream_graph(state: PlannerState):
    """通过 LangGraph astream 流式输出"""
    try:
        async for event in planner_graph.astream(state):
            node_name = list(event.keys())[0]
            node_data = event[node_name]
            
            if node_name == "search_node":
                yield f"data: {json.dumps({'status': 'searching', 'node': node_name, 'flights': len(node_data.get('flights', [])), 'hotels': len(node_data.get('hotels', [])), 'attractions': len(node_data.get('attractions', []))}, ensure_ascii=False)}\n\n"
            elif node_name == "summarize_node":
                msgs = node_data.get("messages", [])
                content = msgs[-1]["content"] if msgs else ""
                yield f"data: {json.dumps({'status': 'done', 'content': content}, ensure_ascii=False)}\n\n"
            elif node_name == "planner_node":
                yield f"data: {json.dumps({'status': 'planning', 'node': node_name}, ensure_ascii=False)}\n\n"
        
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'status': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
```

- [ ] **Step 2: 注册路由到 `backend/app/main.py`**

在 `from app.routers import chat` 后添加：
```python
from app.routers import trip
```

在 `app.include_router(chat.router)` 后添加：
```python
app.include_router(trip.router)
```

- [ ] **Step 3: 验证路由注册**

```bash
$env:PYTHONPATH = "$PWD\lib"; python -c "from app.main import app; routes = [r.path for r in app.routes]; print([r for r in routes if 'trip' in r])"
```

Expected: `['/api/trip/plan', '/api/trip/plan/stream']`

---

### Task 5: 联调验证 — 端到端测试

**Files:**
- Create: `backend/test_agent.py`

- [ ] **Step 1: 创建端到端测试脚本 `backend/test_agent.py`**

```python
"""Phase 2 端到端验证脚本"""
import asyncio
import json
from app.agents.state import PlannerState
from app.agents.planner_graph import search_node, summarize_node


async def test_full_flow():
    """测试完整流程：搜索 + 生成行程"""
    state: PlannerState = {
        "messages": [
            {"role": "user", "content": "请帮我规划一次东京的5天旅行。预算10000元。偏好：美食、文化。"}
        ],
        "destination": "东京",
        "days": 5,
        "budget": 10000,
        "preferences": ["美食", "文化"],
        "departure_city": "北京",
        "travelers": 1,
        "flights": None,
        "hotels": None,
        "attractions": None,
        "itinerary": None,
        "total_budget_estimate": None,
        "next_step": None,
        "error": None,
    }
    
    print("=" * 60)
    print("Phase 2 端到端测试: AI 旅行规划师 Agent")
    print("=" * 60)
    
    # Step 1: 搜索
    print("\n[1/2] 执行搜索节点...")
    state = await search_node(state)
    print(f"  - 航班: {len(state.get('flights', []))} 个")
    print(f"  - 酒店: {len(state.get('hotels', []))} 家")
    print(f"  - 景点: {len(state.get('attractions', []))} 个")
    
    assert len(state.get("flights", [])) > 0, "航班搜索失败"
    assert len(state.get("hotels", [])) > 0, "酒店搜索失败"
    assert len(state.get("attractions", [])) > 0, "景点搜索失败"
    print("  ✓ 搜索完成")
    
    # Step 2: 生成行程
    print("\n[2/2] 执行摘要节点（生成行程）...")
    state = await summarize_node(state)
    msgs = state.get("messages", [])
    assert len(msgs) > 0, "行程生成失败"
    content = msgs[-1]["content"]
    print(f"  ✓ 行程已生成（{len(content)} 字符）")
    print("\n" + "=" * 60)
    print("生成结果（前500字符）:")
    print("-" * 60)
    print(content[:500])
    print("-" * 60)
    print("\n✓ 所有测试通过！Phase 2 Agent 核心功能正常。")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_full_flow())
```

- [ ] **Step 2: 运行测试**

```bash
$env:PYTHONPATH = "$PWD\lib"; $env:OPENAI_API_KEY = "sk-test-placeholder"; python test_agent.py
```

Expected: 搜索到 3 个航班、4 家酒店、3 个景点（按偏好筛选），生成行程文本。

Note: 如果没配 API Key，search_node 的 mock 数据仍可正常返回。summarize_node 需要 API Key 才能生成行程文字，但不会报错，只是 messages 为空。

---

### Task 6: 前端接入旅行规划功能

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/ChatInput.tsx`

- [ ] **Step 1: 在 App.tsx 中添加规划按钮和快速规划功能**

在 `ChatInput` 上方添加快速规划按钮区域。修改 `App.tsx`：

```tsx
// 在 handleSend 函数之后，添加快速规划处理函数
const handleQuickPlan = async () => {
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
    content: `帮我规划一次${planRequest.destination}的${planRequest.days}天旅行，预算${planRequest.budget}元，偏好${planRequest.preferences.join("、")}`,
  }
  setMessages((prev) => [...prev, userMsg])
  setIsLoading(true)

  const assistantMsg: Message = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: "",
  }
  setMessages((prev) => [...prev, assistantMsg])

  try {
    const response = await fetch("/api/trip/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planRequest),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            if (parsed.done) break
            if (parsed.status === "searching" || parsed.status === "searched" || parsed.status === "generating") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: `🔄 ${parsed.message}` }
                    : m
                )
              )
            } else if (parsed.status === "done" && parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: parsed.content }
                    : m
                )
              )
            } else if (parsed.status === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: `[错误] ${parsed.message}` }
                    : m
                )
              )
            }
          } catch {}
        }
      }
    }
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

- [ ] **Step 2: 在 JSX 中添加快速规划按钮**

在 ChatWindow 和 ChatInput 之间添加：

```tsx
{/* 快速规划按钮 */}
<div className="px-4 pb-2 flex gap-2 flex-wrap justify-center">
  <button
    onClick={handleQuickPlan}
    disabled={isLoading}
    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-40 transition-all"
  >
    ✈️ 东京5天·美食文化之旅
  </button>
  <button
    onClick={() => handleSend("帮我规划一次大阪的4天旅行，预算8000元，偏好购物和美食")}
    disabled={isLoading}
    className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-full text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-all"
  >
    🏯 大阪4天·购物美食
  </button>
  <button
    onClick={() => handleSend("推荐一个适合放松的东南亚海岛，预算5000，玩5天")}
    disabled={isLoading}
    className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-full text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-all"
  >
    🏖️ 东南亚海岛·放松之旅
  </button>
</div>
```

---

### Task 7: 最终验证

- [ ] **Step 1: 重启后端并测试**

```bash
$env:PYTHONPATH = "$PWD\lib"; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- [ ] **Step 2: 测试 API 端点**

```bash
Invoke-WebRequest -Uri http://localhost:8000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected: `{"status":"ok","service":"AI 旅行规划师"}`

- [ ] **Step 3: 用 curl 测试规划接口**

```bash
curl -X POST http://localhost:8000/api/trip/plan -H "Content-Type: application/json" -d "{\"destination\":\"东京\",\"days\":3,\"budget\":5000,\"preferences\":[\"美食\"],\"departure\":\"北京\"}"
```

Expected: SSE 流式输出搜索进度和行程结果。

---

## 完成标志

- [x] Task 1: LangGraph 安装完成
- [x] Task 2: 工具函数可独立调用
- [x] Task 3: LangGraph 工作流编译通过
- [x] Task 4: API 路由可访问
- [x] Task 5: 端到端测试通过
- [x] Task 6: 前端可触发规划
- [x] Task 7: 全链路联调通过