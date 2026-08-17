"""目的地搜索路由 — LLM 动态生成城市详情、景点、酒店等"""

import json
from fastapi import APIRouter, Query
from app.tools.search_tools import search_attractions, search_hotels, search_flights, MOCK_ATTRACTIONS, MOCK_HOTELS, MOCK_FLIGHTS
from app.core.llm import get_llm_client

router = APIRouter(prefix="/api/search", tags=["search"])

# 搜索结果缓存
_search_cache: dict[str, dict] = {}

# 城市概览数据
CITY_OVERVIEWS = {
    "东京": {
        "name": "东京", "country": "日本",
        "description": "东京是日本的首都，融合了超现代与传统文化的国际大都市。从繁华的涩谷十字路口到古老的浅草寺，从秋叶原的二次元文化到银座的顶级购物体验，东京能给你无尽的惊喜。",
        "best_season": "春季（3-5月）赏樱、秋季（9-11月）赏红叶",
        "currency": "日元 (JPY)", "language": "日语", "timezone": "UTC+9", "visa": "需提前办理日本签证",
        "images": [f"https://picsum.photos/seed/tokyo-skyline/800/400", f"https://picsum.photos/seed/tokyo-temple/800/400"],
        "hot_tags": ["美食天堂", "购物圣地", "动漫文化", "古寺名园", "温泉"],
        "daily_budget": "¥800-2000/天（不含机票）",
    },
    "大阪": {
        "name": "大阪", "country": "日本",
        "description": "大阪是日本关西地区的核心城市，以美食和热情的人民闻名。道顿堀的霓虹招牌、大阪城的历史厚重、环球影城的欢乐刺激，让大阪成为热门旅行目的地。",
        "best_season": "春季（3-5月）、秋季（10-11月）",
        "currency": "日元 (JPY)", "language": "日语", "timezone": "UTC+9", "visa": "需提前办理日本签证",
        "images": [f"https://picsum.photos/seed/osaka-castle/800/400", f"https://picsum.photos/seed/dotonbori-osaka/800/400"],
        "hot_tags": ["美食天堂", "环球影城", "历史名城", "购物", "章鱼烧"],
        "daily_budget": "¥700-1500/天（不含机票）",
    },
    "曼谷": {
        "name": "曼谷", "country": "泰国",
        "description": "曼谷是泰国的首都，被称为'天使之城'。金碧辉煌的大皇宫、热闹的夜市、美味的街头小吃和物美价廉的购物体验，让曼谷成为东南亚最受欢迎的旅行目的地之一。",
        "best_season": "11月-次年2月（凉季，气候宜人）",
        "currency": "泰铢 (THB)", "language": "泰语", "timezone": "UTC+7", "visa": "中国公民可落地签",
        "images": [f"https://picsum.photos/seed/bangkok-temple/800/400", f"https://picsum.photos/seed/bangkok-floating-market/800/400"],
        "hot_tags": ["美食", "夜市", "寺庙", "按摩", "水上市场"],
        "daily_budget": "¥300-800/天（不含机票）",
    },
    "巴黎": {
        "name": "巴黎", "country": "法国",
        "description": "巴黎是法国的首都，被誉为'光之城'。埃菲尔铁塔、卢浮宫、香榭丽舍大街、塞纳河畔的咖啡馆，巴黎是浪漫、艺术和时尚的代名词。",
        "best_season": "春季（4-6月）、秋季（9-10月）",
        "currency": "欧元 (EUR)", "language": "法语", "timezone": "UTC+1", "visa": "需办理申根签证",
        "images": [f"https://picsum.photos/seed/eiffel-tower-paris/800/400", f"https://picsum.photos/seed/louvre-museum/800/400"],
        "hot_tags": ["浪漫之都", "艺术殿堂", "美食", "奢侈品", "博物馆"],
        "daily_budget": "¥1500-3000/天（不含机票）",
    },
    "京都": {
        "name": "京都", "country": "日本",
        "description": "京都是日本的古都，保存了最完整的日本传统文化。数千座寺庙神社、优雅的艺伎文化、精致的怀石料理和美丽的岚山竹林，让京都成为感受日本传统之美的最佳目的地。",
        "best_season": "春季（3-4月）赏樱、秋季（11月）赏红叶",
        "currency": "日元 (JPY)", "language": "日语", "timezone": "UTC+9", "visa": "需提前办理日本签证",
        "images": [f"https://picsum.photos/seed/kyoto-temple/800/400", f"https://picsum.photos/seed/bamboo-forest-kyoto/800/400"],
        "hot_tags": ["古都", "寺庙", "和服体验", "茶道", "怀石料理"],
        "daily_budget": "¥800-1800/天（不含机票）",
    },
    "巴厘岛": {
        "name": "巴厘岛", "country": "印度尼西亚",
        "description": "巴厘岛是印度尼西亚最著名的旅游胜地，以梯田、寺庙、海滩和水疗闻名。乌布的艺术氛围、库塔的冲浪海滩、金巴兰的落日海鲜，都让人流连忘返。",
        "best_season": "4-10月（旱季）",
        "currency": "印尼盾 (IDR)", "language": "印尼语", "timezone": "UTC+8", "visa": "中国公民可落地签",
        "images": [f"https://picsum.photos/seed/bali-rice-terrace/800/400", f"https://picsum.photos/seed/bali-temple/800/400"],
        "hot_tags": ["海岛度假", "冲浪", "SPA", "梯田", "日落"],
        "daily_budget": "¥500-1500/天（不含机票）",
    },
    "首尔": {
        "name": "首尔", "country": "韩国",
        "description": "首尔是韩国的首都，K-pop和韩剧文化的发源地。景福宫的历史底蕴、明洞的购物热潮、弘大的青春活力，以及遍布全城的美食，让首尔成为年轻人喜爱的旅行目的地。",
        "best_season": "春季（4-5月）、秋季（9-10月）",
        "currency": "韩元 (KRW)", "language": "韩语", "timezone": "UTC+9", "visa": "济州岛免签，首尔需签证",
        "images": [f"https://picsum.photos/seed/seoul-gyeongbokgung/800/400", f"https://picsum.photos/seed/myeongdong-seoul/800/400"],
        "hot_tags": ["K-pop", "购物", "美食", "韩服体验", "夜景"],
        "daily_budget": "¥600-1500/天（不含机票）",
    },
    "纽约": {
        "name": "纽约", "country": "美国",
        "description": "纽约是美国最大的城市，世界的金融和文化中心。自由女神像、时代广场、中央公园、百老汇和大都会博物馆，让纽约成为无数人梦想中的旅行目的地。",
        "best_season": "春季（4-6月）、秋季（9-11月）",
        "currency": "美元 (USD)", "language": "英语", "timezone": "UTC-5", "visa": "需办理美国签证",
        "images": [f"https://picsum.photos/seed/newyork-skyline/800/400", f"https://picsum.photos/seed/times-square-nyc/800/400"],
        "hot_tags": ["都市探索", "百老汇", "博物馆", "购物", "美食"],
        "daily_budget": "¥1500-3500/天（不含机票）",
    },
    "伦敦": {
        "name": "伦敦", "country": "英国",
        "description": "伦敦是英国的首都，一座充满历史与现代交融的城市。大本钟、白金汉宫、大英博物馆、伦敦眼和西区剧院，让伦敦成为欧洲最受欢迎的旅行目的地之一。",
        "best_season": "5-9月（气候最佳）",
        "currency": "英镑 (GBP)", "language": "英语", "timezone": "UTC+0", "visa": "需办理英国签证",
        "images": [f"https://picsum.photos/seed/london-bigben/800/400", f"https://picsum.photos/seed/london-bridge/800/400"],
        "hot_tags": ["历史", "博物馆", "皇室", "下午茶", "剧院"],
        "daily_budget": "¥1200-3000/天（不含机票）",
    },
}


async def _llm_generate_city_data(city: str, departure: str = "北京") -> dict:
    """使用 LLM 生成城市搜索数据"""
    llm = get_llm_client()
    client = llm.get_client()

    prompt = f"""你是一个专业的旅行数据专家。请为"{city}"生成真实的旅行搜索数据，以 JSON 格式返回。

要求：
1. 所有数据必须真实、准确，就像真实的旅游网站数据一样
2. 景点名称、描述、开放时间、门票价格、交通方式都要真实
3. 酒店名称、地址、价格要符合实际市场行情
4. 航班信息要合理（从{departure}出发）

请严格按照以下 JSON 格式返回，不要添加任何额外说明：

```json
{{
  "overview": {{
    "name": "城市名",
    "country": "国家",
    "description": "150字以内的城市介绍，突出特色",
    "best_season": "最佳旅行季节和原因",
    "currency": "当地货币",
    "language": "官方语言",
    "timezone": "时区",
    "visa": "中国公民签证政策",
    "hot_tags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
    "daily_budget": "人均每日预算范围（人民币）"
  }},
  "attractions": [
    {{
      "name": "景点名称",
      "category": "文化/自然/美食/购物/娱乐",
      "estimated_duration": "建议游玩时长",
      "ticket_price": 门票价格(人民币),
      "description": "50字以内景点描述",
      "opening_hours": "开放时间",
      "closing_day": "闭馆日",
      "need_booking": true/false,
      "rating": 4.0-5.0,
      "review_count": 评论数,
      "suggested_duration": "建议游玩时长",
      "tips": "实用贴士",
      "tags": ["标签1", "标签2"],
      "how_to_get": [{{"mode": "交通方式", "route": "路线", "duration": "耗时", "price": 费用(人民币)}}]
    }}
  ],
  "hotels": [
    {{
      "name": "酒店名称",
      "rating": 评分,
      "price_per_night": 每晚价格(人民币),
      "address": "具体地址",
      "tags": ["标签1", "标签2"],
      "distance_to_station": "距最近交通站距离",
      "match_reason": "推荐理由（50字以内）"
    }}
  ],
  "flights": [
    {{
      "airline": "航司名称",
      "flight_no": "航班号",
      "departure_time": "出发时间",
      "arrival_time": "到达时间",
      "price": 价格(人民币),
      "duration": "飞行时长",
      "baggage": "行李额度",
      "seats_left": 剩余座位数,
      "departure_airport": "出发机场",
      "arrival_airport": "到达机场"
    }}
  ]
}}
```

重要：
- attractions 提供 5-6 个真实景点
- hotels 提供 3-4 个真实酒店，覆盖经济型到豪华型
- flights 提供 2-3 个真实航班
- 所有价格单位为人民币
- 只返回 JSON，不要任何额外文字"""

    try:
        response = await client.chat.completions.create(
            model=llm.get_model(),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4096,
        )
        content = response.choices[0].message.content or ""
        
        # 提取 JSON
        json_start = content.find("{")
        json_end = content.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(content[json_start:json_end])
            return data
    except Exception as e:
        print(f"LLM 生成 {city} 数据失败: {e}")
    
    return None


def _build_fallback(city: str) -> dict:
    """构建兜底数据"""
    return {
        "overview": {
            "name": city, "country": "国际",
            "description": f"{city}是一个充满魅力的旅行目的地，拥有丰富的文化底蕴和独特的自然风光，等待您的探索。",
            "best_season": "全年皆宜",
            "currency": "当地货币", "language": "当地语言", "timezone": "当地时区",
            "visa": "请查询最新签证政策",
            "images": [f"https://picsum.photos/seed/{city}1/800/400", f"https://picsum.photos/seed/{city}2/800/400"],
            "hot_tags": ["旅行", "探索", "文化"],
            "daily_budget": "¥500-2000/天",
        },
        "attractions": search_attractions(city),
        "hotels": search_hotels(city),
        "flights": search_flights("北京", city),
    }


@router.get("")
async def search_destination(q: str = Query(..., description="搜索关键词（城市名）")):
    """搜索目的地：优先使用预置数据，否则用 LLM 动态生成"""
    # 模糊匹配城市名
    city = q
    for key in CITY_OVERVIEWS:
        if key in q or q in key:
            city = key
            break

    # 检查缓存
    cache_key = city.lower()
    if cache_key in _search_cache:
        return _search_cache[cache_key]

    # 检查是否有充足的 mock 数据（>1 个景点说明有真实数据）
    has_mock = city in MOCK_ATTRACTIONS and len(MOCK_ATTRACTIONS[city]) > 1

    if has_mock and city in CITY_OVERVIEWS:
        # 使用预置数据
        result = {
            "overview": CITY_OVERVIEWS[city],
            "attractions": search_attractions(city),
            "hotels": search_hotels(city),
            "flights": search_flights("北京", city),
        }
        _search_cache[cache_key] = result
        return result

    # LLM 动态生成
    llm_data = await _llm_generate_city_data(city)
    
    if llm_data and llm_data.get("attractions") and len(llm_data["attractions"]) > 1:
        overview = llm_data["overview"]
        overview["images"] = [
            f"https://picsum.photos/seed/{city.replace(' ','-')}1/800/400",
            f"https://picsum.photos/seed/{city.replace(' ','-')}2/800/400",
        ]
        
        result = {
            "overview": overview,
            "attractions": llm_data["attractions"],
            "hotels": llm_data["hotels"],
            "flights": llm_data["flights"],
        }
        _search_cache[cache_key] = result
        return result

    # 兜底
    return _build_fallback(city)