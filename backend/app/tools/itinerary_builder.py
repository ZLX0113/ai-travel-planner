"""行程模板构建器 — 将搜索结果编排为结构化 DayPlan"""

from datetime import datetime, timedelta
from app.agents.state import (
    DayPlan,
    FlightInfo,
    HotelInfo,
    AttractionInfo,
)

# 三餐建议（按城市，每日不重样）
MEAL_SUGGESTIONS = {
    "东京": {
        "早餐": [
            {"suggestion": "筑地市场寿司早餐", "price": 60},
            {"suggestion": "日式定食朝食+味噌汤", "price": 50},
            {"suggestion": "便利店日式饭团+咖啡", "price": 30},
        ],
        "午餐": [
            {"suggestion": "一兰拉面/博多风龙拉面", "price": 80},
            {"suggestion": "天妇罗定食/鳗鱼饭", "price": 100},
            {"suggestion": "回转寿司/海鲜丼", "price": 90},
        ],
        "晚餐": [
            {"suggestion": "居酒屋(烤串+啤酒)", "price": 150},
            {"suggestion": "烤肉放题/和牛烧肉", "price": 200},
            {"suggestion": "寿司名店/怀石料理", "price": 250},
        ],
    },
    "大阪": {
        "早餐": [
            {"suggestion": "大阪烧朝食", "price": 40},
            {"suggestion": "日式定食+明太子", "price": 45},
            {"suggestion": "便利店三明治+酸奶", "price": 25},
        ],
        "午餐": [
            {"suggestion": "道顿堀章鱼烧+炸串", "price": 70},
            {"suggestion": "大阪拉面/金龙拉面", "price": 75},
            {"suggestion": "大阪寿司/海鲜盖饭", "price": 85},
        ],
        "晚餐": [
            {"suggestion": "河豚料理/寿喜烧", "price": 180},
            {"suggestion": "铁板烧/神户牛", "price": 220},
            {"suggestion": "道顿堀居酒屋", "price": 130},
        ],
    },
    "曼谷": {
        "早餐": [
            {"suggestion": "泰式炒粉(Pad Thai)+泰式奶茶", "price": 30},
            {"suggestion": "芒果糯米饭+椰奶", "price": 25},
            {"suggestion": "泰式粥+炸鸡", "price": 20},
        ],
        "午餐": [
            {"suggestion": "冬阴功汤+青咖喱+米饭", "price": 60},
            {"suggestion": "泰式炒饭+沙爹串", "price": 50},
            {"suggestion": "船面/泰式炒河粉", "price": 40},
        ],
        "晚餐": [
            {"suggestion": "夜市小吃(烤虾/烤鱼/泰式烤串)", "price": 100},
            {"suggestion": "海鲜烧烤大排档", "price": 150},
            {"suggestion": "泰式火锅/屋顶餐厅", "price": 200},
        ],
    },
    "巴黎": {
        "早餐": [
            {"suggestion": "可颂+咖啡+鲜榨橙汁", "price": 60},
            {"suggestion": "法式薄饼(Nutella+香蕉)", "price": 50},
            {"suggestion": "法棍三明治+拿铁", "price": 40},
        ],
        "午餐": [
            {"suggestion": "法式三明治(Croque Monsieur)+沙拉", "price": 100},
            {"suggestion": "尼斯沙拉+法式咸派", "price": 90},
            {"suggestion": "法式牛排薯条(Steak Frites)", "price": 120},
        ],
        "晚餐": [
            {"suggestion": "法餐三道式(前菜+主菜+甜品)", "price": 250},
            {"suggestion": "红酒炖牛肉+烤鸭胸", "price": 200},
            {"suggestion": "鹅肝+海鲜拼盘", "price": 300},
        ],
    },
    "京都": {
        "早餐": [
            {"suggestion": "日式朝食定食(烤鱼/玉子烧/味噌汤)", "price": 60},
            {"suggestion": "抹茶+和果子+茶泡饭", "price": 50},
            {"suggestion": "豆腐朝食/汤豆腐", "price": 40},
        ],
        "午餐": [
            {"suggestion": "汤豆腐料理/精进料理", "price": 80},
            {"suggestion": "荞麦面(ざるそば)+天妇罗", "price": 70},
            {"suggestion": "亲子丼/京鱼定食", "price": 75},
        ],
        "晚餐": [
            {"suggestion": "怀石料理(8品)", "price": 250},
            {"suggestion": "京番菜/寿喜烧", "price": 180},
            {"suggestion": "锦市场小食巡礼", "price": 120},
        ],
    },
    "首尔": {
        "早餐": [
            {"suggestion": "韩式泡菜汤+米饭", "price": 40},
            {"suggestion": "紫菜包饭+鱼饼汤", "price": 30},
            {"suggestion": "韩式粥+泡菜", "price": 35},
        ],
        "午餐": [
            {"suggestion": "韩式拌饭+大酱汤", "price": 60},
            {"suggestion": "炸鸡+啤酒(半只)", "price": 70},
            {"suggestion": "部队锅+拉面", "price": 65},
        ],
        "晚餐": [
            {"suggestion": "韩式烤肉(五花肉+韩牛)", "price": 150},
            {"suggestion": "参鸡汤", "price": 100},
            {"suggestion": "酱蟹/活章鱼", "price": 120},
        ],
    },
    "巴厘岛": {
        "早餐": [
            {"suggestion": "热带水果拼盘+印尼炒饭", "price": 40},
            {"suggestion": "Smoothie Bowl+椰子水", "price": 45},
            {"suggestion": "印尼炒面+煎蛋", "price": 30},
        ],
        "午餐": [
            {"suggestion": "脏鸭餐(Bebek Bengil)", "price": 60},
            {"suggestion": "印尼沙爹+印尼炒饭", "price": 50},
            {"suggestion": "海鲜烧烤+椰子饭", "price": 70},
        ],
        "晚餐": [
            {"suggestion": "金巴兰海鲜日落晚餐", "price": 150},
            {"suggestion": "巴厘烤猪(Babi Guling)", "price": 100},
            {"suggestion": "Seminyak高级餐厅", "price": 180},
        ],
    },
    "纽约": {
        "早餐": [
            {"suggestion": "贝果+奶油芝士+咖啡", "price": 60},
            {"suggestion": "美式煎饼+枫糖浆+培根", "price": 70},
            {"suggestion": "牛油果吐司+拿铁", "price": 55},
        ],
        "午餐": [
            {"suggestion": "Shake Shack汉堡+薯条", "price": 90},
            {"suggestion": "纽约披萨(大块)+沙拉", "price": 70},
            {"suggestion": "街头热狗+椒盐脆饼", "price": 50},
        ],
        "晚餐": [
            {"suggestion": "Peter Luger牛排馆", "price": 250},
            {"suggestion": "意大利菜/小意大利区", "price": 150},
            {"suggestion": "日料/寿司名店", "price": 200},
        ],
    },
    "伦敦": {
        "早餐": [
            {"suggestion": "英式全早餐(Full English)", "price": 70},
            {"suggestion": "司康+凝脂奶油+茶", "price": 50},
            {"suggestion": "牛角包+咖啡", "price": 40},
        ],
        "午餐": [
            {"suggestion": "炸鱼薯条+豌豆泥", "price": 80},
            {"suggestion": "Coronation Chicken三明治", "price": 60},
            {"suggestion": "印度咖喱+馕饼", "price": 70},
        ],
        "晚餐": [
            {"suggestion": "英式烤肉(Sunday Roast)", "price": 150},
            {"suggestion": "米其林餐厅/法餐", "price": 250},
            {"suggestion": "街边美食市场/博罗市场", "price": 100},
        ],
    },
}

DEFAULT_MEALS = {
    "早餐": [
        {"suggestion": "当地特色早餐(第一日)", "price": 50},
        {"suggestion": "当地特色早餐(第二日)", "price": 50},
        {"suggestion": "当地特色早餐(第三日)", "price": 50},
    ],
    "午餐": [
        {"suggestion": "当地特色午餐(第一日)", "price": 80},
        {"suggestion": "当地特色午餐(第二日)", "price": 80},
        {"suggestion": "当地特色午餐(第三日)", "price": 80},
    ],
    "晚餐": [
        {"suggestion": "当地特色晚餐(第一日)", "price": 150},
        {"suggestion": "当地特色晚餐(第二日)", "price": 150},
        {"suggestion": "当地特色晚餐(第三日)", "price": 150},
    ],
}


def build_itinerary(
    flights: list[FlightInfo],
    hotels: list[HotelInfo],
    attractions: list[AttractionInfo],
    days: int,
    destination: str,
    selected_flight_index: int = 0,
    selected_hotel_index: int = 0,
    start_date: str | None = None,
    meals_input: dict | None = None,
) -> list[DayPlan]:
    """根据搜索结果构建每日行程 — 每天3-4个景点，含三餐和交通，每天主题不同"""
    if start_date is None:
        start_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    base_date = datetime.strptime(start_date, "%Y-%m-%d")
    meals = meals_input or MEAL_SUGGESTIONS.get(destination, DEFAULT_MEALS)
    # 兼容旧格式：如果是列表则转为新格式
    if isinstance(meals, list):
        meals = {
            "早餐": [{"suggestion": meals[0]["suggestion"], "price": meals[0]["price"]}],
            "午餐": [{"suggestion": meals[1]["suggestion"], "price": meals[1]["price"]}],
            "晚餐": [{"suggestion": meals[2]["suggestion"], "price": meals[2]["price"]}],
        }

    # 每天不同主题 + 对应的景点类别偏好
    day_themes = ["经典探索", "深度体验", "隐藏乐趣", "文化巡礼", "休闲放松", "购物狂欢", "美食之旅"]
    # 每个主题优先选择的景点类别（按优先级排列，确保每天风格不同）
    theme_category_prefs = {
        "经典探索": ["文化", "自然", "美食", "购物", "娱乐"],
        "深度体验": ["文化", "美食", "自然", "娱乐", "购物"],
        "隐藏乐趣": ["自然", "娱乐", "美食", "文化", "购物"],
        "文化巡礼": ["文化", "购物", "自然", "美食", "娱乐"],
        "休闲放松": ["自然", "美食", "文化", "娱乐", "购物"],
        "购物狂欢": ["购物", "美食", "娱乐", "文化", "自然"],
        "美食之旅": ["美食", "购物", "娱乐", "自然", "文化"],
    }
    day_notes = [
        "首日适应节奏，安排经典地标景点，轻松开启旅程",
        "精力充沛的一天，深入探索当地文化精髓",
        "行程过半，放慢节奏，发现城市隐藏的惊喜角落",
        "沉浸式文化体验，感受城市的历史底蕴与艺术气息",
        "放松身心的一天，享受自然风光与悠闲时光",
        "购物和美食的狂欢日，尽情享受消费乐趣",
        "最后一天，用美食为旅程画上完美句号",
    ]

    # === 按主题分配景点：每天从不同类别优先选取 ===
    all_attrs = list(attractions)
    # 按类别分组
    by_category: dict[str, list] = {}
    for attr in all_attrs:
        cat = attr.get("category", "文化")
        by_category.setdefault(cat, []).append(attr)

    daily_attractions: list[list[AttractionInfo]] = [[] for _ in range(days)]
    used_attrs: set[str] = set()  # 已分配的景点名称，确保不重复

    max_per_day = 4
    for day in range(days):
        theme = day_themes[day % len(day_themes)]
        prefs = theme_category_prefs.get(theme, ["文化", "自然", "美食", "购物", "娱乐"])
        day_attrs = daily_attractions[day]

        # 按主题偏好顺序，从各类别中取景点
        for cat in prefs:
            if len(day_attrs) >= max_per_day:
                break
            candidates = [a for a in by_category.get(cat, []) if a["name"] not in used_attrs]
            # 每天每类最多取2个，保证多样性
            taken = 0
            for a in candidates:
                if len(day_attrs) >= max_per_day or taken >= 2:
                    break
                day_attrs.append(a)
                used_attrs.add(a["name"])
                taken += 1

        # 如果还不够，从未分配的景点中补充
        if len(day_attrs) < 2:
            remaining = [a for a in all_attrs if a["name"] not in used_attrs]
            for a in remaining:
                if len(day_attrs) >= max_per_day:
                    break
                day_attrs.append(a)
                used_attrs.add(a["name"])

    itinerary: list[DayPlan] = []

    for day in range(days):
        date = base_date + timedelta(days=day)
        date_str = date.strftime("%m月%d日")
        day_label = f"Day {day + 1}"
        theme = day_themes[day % len(day_themes)]
        note = day_notes[day % len(day_notes)]

        # 每日不同餐饮索引
        meal_idx = day % 3

        nodes = []
        activities = []

        # === 早餐 ===
        breakfast_list = meals.get("早餐", [{"suggestion": "当地早餐", "price": 50}])
        breakfast = breakfast_list[meal_idx % len(breakfast_list)]
        nodes.append({
            "time": "08:00",
            "type": "meal",
            "title": breakfast["suggestion"],
            "category": "早餐",
            "detail": {"price": breakfast["price"], "notes": "享用当地特色早餐，为一天的行程补充能量"},
        })

        # === 上午景点 ===
        morning_attrs = daily_attractions[day][:2]
        for i, attr in enumerate(morning_attrs):
            hour = 9 + i * 2
            hour_str = f"{hour:02d}:00"

            nodes.append({
                "time": hour_str,
                "type": "attraction",
                "title": attr["name"],
                "category": attr.get("category", ""),
                "detail": {
                    "name": attr["name"],
                    "images": attr.get("images", []),
                    "ticketPrice": attr.get("ticket_price", 0),
                    "free": attr.get("ticket_price", 0) == 0,
                    "openingHours": attr.get("opening_hours", ""),
                    "closingDay": attr.get("closing_day", ""),
                    "needBooking": attr.get("need_booking", False),
                    "rating": attr.get("rating", 0),
                    "reviewCount": attr.get("review_count", 0),
                    "suggestedDuration": attr.get("suggested_duration", attr.get("estimated_duration", "2小时")),
                    "howToGet": attr.get("how_to_get", []),
                    "tips": attr.get("tips", ""),
                    "tags": attr.get("tags", []),
                },
            })

            activities.append({
                "name": attr["name"],
                "time": "上午",
                "duration": attr["estimated_duration"],
                "notes": attr["description"],
                "category": attr["category"],
                "ticket_price": attr["ticket_price"],
            })

            # 景点间通勤
            if i < len(morning_attrs) - 1:
                next_attr = morning_attrs[i + 1]
                transit_hour = hour + 2
                nodes.append({
                    "time": f"{transit_hour:02d}:00",
                    "type": "transit",
                    "title": f"{attr['name']} → {next_attr['name']}",
                    "category": "交通",
                    "detail": {
                        "mode": "🚇 地铁",
                        "route": "乘坐地铁约3站",
                        "duration": "15分钟",
                        "price": 180,
                        "alternatives": [
                            {"mode": "🚇 地铁", "route": "市区线", "duration": "15分钟", "price": 180},
                            {"mode": "🚕 出租车", "route": "直达", "duration": "10分钟", "price": 1200},
                            {"mode": "🚲 骑行", "route": "骑行道", "duration": "20分钟", "price": 0},
                        ],
                    },
                })

        # === 午餐 ===
        lunch_list = meals.get("午餐", [{"suggestion": "当地午餐", "price": 80}])
        lunch = lunch_list[meal_idx % len(lunch_list)]
        nodes.append({
            "time": "12:30",
            "type": "meal",
            "title": lunch["suggestion"],
            "category": "午餐",
            "detail": {"price": lunch["price"], "notes": "上午游览结束，就近品尝当地美食"},
        })

        # === 下午景点 ===
        afternoon_attrs = daily_attractions[day][2:]
        for i, attr in enumerate(afternoon_attrs):
            hour = 14 + i * 2
            hour_str = f"{hour:02d}:00"

            nodes.append({
                "time": hour_str,
                "type": "attraction",
                "title": attr["name"],
                "category": attr.get("category", ""),
                "detail": {
                    "name": attr["name"],
                    "images": attr.get("images", []),
                    "ticketPrice": attr.get("ticket_price", 0),
                    "free": attr.get("ticket_price", 0) == 0,
                    "openingHours": attr.get("opening_hours", ""),
                    "closingDay": attr.get("closing_day", ""),
                    "needBooking": attr.get("need_booking", False),
                    "rating": attr.get("rating", 0),
                    "reviewCount": attr.get("review_count", 0),
                    "suggestedDuration": attr.get("suggested_duration", attr.get("estimated_duration", "2小时")),
                    "howToGet": attr.get("how_to_get", []),
                    "tips": attr.get("tips", ""),
                    "tags": attr.get("tags", []),
                },
            })

            activities.append({
                "name": attr["name"],
                "time": "下午" if i == 0 else "傍晚",
                "duration": attr["estimated_duration"],
                "notes": attr["description"],
                "category": attr["category"],
                "ticket_price": attr["ticket_price"],
            })

            # 景点间通勤
            if i < len(afternoon_attrs) - 1:
                next_attr = afternoon_attrs[i + 1]
                transit_hour = hour + 2
                nodes.append({
                    "time": f"{transit_hour:02d}:00",
                    "type": "transit",
                    "title": f"{attr['name']} → {next_attr['name']}",
                    "category": "交通",
                    "detail": {
                        "mode": "🚇 地铁",
                        "route": "乘坐地铁约3站",
                        "duration": "15分钟",
                        "price": 180,
                        "alternatives": [
                            {"mode": "🚇 地铁", "route": "市区线", "duration": "15分钟", "price": 180},
                            {"mode": "🚕 出租车", "route": "直达", "duration": "10分钟", "price": 1200},
                        ],
                    },
                })

        # 最后景点到酒店的通勤
        last_attr = daily_attractions[day][-1] if daily_attractions[day] else None
        if last_attr and hotels and selected_hotel_index < len(hotels):
            h = hotels[selected_hotel_index]
            nodes.append({
                "time": "17:00",
                "type": "transit",
                "title": f"{last_attr['name']} → {h['name']}",
                "category": "交通",
                "detail": {
                    "mode": "🚇 地铁",
                    "route": "返回酒店",
                    "duration": "20分钟",
                    "price": 200,
                    "alternatives": [
                        {"mode": "🚇 地铁", "route": "市区线", "duration": "20分钟", "price": 200},
                        {"mode": "🚕 出租车", "route": "直达", "duration": "12分钟", "price": 1500},
                    ],
                },
            })

        # === 晚餐 ===
        dinner_list = meals.get("晚餐", [{"suggestion": "当地晚餐", "price": 150}])
        dinner = dinner_list[meal_idx % len(dinner_list)]
        nodes.append({
            "time": "18:30",
            "type": "meal",
            "title": dinner["suggestion"],
            "category": "晚餐",
            "detail": {"price": dinner["price"], "notes": "一天游览结束，尽情享受当地美食"},
        })

        # === 酒店入住 ===
        hotel_detail = {}
        if hotels and selected_hotel_index < len(hotels):
            h = hotels[selected_hotel_index]
            hotel_detail = {
                "name": h["name"],
                "images": h.get("images", []),
                "star": h.get("rating", 0),
                "address": h.get("address", ""),
                "pricePerNight": h.get("price_per_night", 0),
                "distanceToStation": h.get("distance_to_station", h.get("highlights", ["近地铁"])[0] if isinstance(h.get("highlights"), list) and h.get("highlights") else "近地铁"),
                "tags": h.get("tags", []) or h.get("highlights", [])[:3],
                "matchReason": "紧邻今日最后一个景点，减少往返绕行",
            }

        nodes.append({
            "time": "20:00",
            "type": "rest",
            "title": f"入住 {hotel_detail.get('name', '酒店')}",
            "category": "住宿",
            "detail": hotel_detail,
        })

        notes = ""
        if day == 0 and flights and selected_flight_index < len(flights):
            f = flights[selected_flight_index]
            notes = f"✈️ 推荐航班 {f['airline']} {f['flight_no']}，{f['departure_time']}-{f['arrival_time']}，¥{f['price']}"

        itinerary.append(DayPlan(
            day=day + 1,
            date=f"Day {day + 1} ({date_str})",
            theme=theme,
            activities=activities,
            nodes=nodes,
            meals=[
                {"type": "早餐", "suggestion": breakfast["suggestion"]},
                {"type": "午餐", "suggestion": lunch["suggestion"]},
                {"type": "晚餐", "suggestion": dinner["suggestion"]},
            ],
            hotel=hotel_detail,
            notes=note,
            weather={"condition": "晴", "temp": "25°C"},
        ))

    return itinerary


def itinerary_to_markdown(
    itinerary: list[DayPlan],
    destination: str,
    flight_info: dict | None = None,
    hotel_info: dict | None = None,
) -> str:
    """将行程转换为 Markdown 格式输出"""
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
        if 'highlights' in hotel_info:
            lines.append(f"- 亮点: {' | '.join(hotel_info['highlights'])}\n")

    lines.append("## 📅 每日行程\n")

    for plan in itinerary:
        lines.append(f"### {plan['date']}")
        if plan.get("theme"):
            lines.append(f"🎯 主题: {plan['theme']}")
        hotel_name = plan['hotel'].get('name', '待定') if isinstance(plan['hotel'], dict) else (plan['hotel'] or '待定')
        lines.append(f"🏨 住宿: {hotel_name}")
        if plan.get("weather"):
            lines.append(f"🌤️ 天气: {plan['weather']['condition']} {plan['weather']['temp']}")
        lines.append("")
        lines.append("| 时间 | 类型 | 内容 |")
        lines.append("|------|------|------|")

        if plan["activities"]:
            lines.append("\n| 时段 | 景点 | 类别 | 时长 | 门票 | 说明 |")
            lines.append("|------|------|------|------|------|------|")
            for act in plan["activities"]:
                notes_short = act['notes'][:30] + "..." if len(act['notes']) > 30 else act['notes']
                lines.append(
                    f"| {act['time']} | {act['name']} | {act['category']} | {act['duration']} | ¥{act['ticket_price']} | {notes_short} |"
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
    
    # 解析修改指令：提取目标天数
    cn_num_map = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
    day_match = re.search(r'第\s*(\d+|[一二三四五六七八九十]+)\s*天', modify_request)
    if not day_match:
        return itinerary, "未能识别修改的目标天数，请用'第X天'的格式描述。"
    
    day_str = day_match.group(1)
    if day_str.isdigit():
        target_day = int(day_str)
    else:
        target_day = cn_num_map.get(day_str, 0)
        if target_day == 0:
            return itinerary, f"无法识别天数 '{day_str}'，请用数字或中文数字表示。"
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


# 版本策略定义
VERSION_STRATEGIES = {
    "budget": {
        "label": "💰 省钱版",
        "description": "精打细算，高性价比，优先免费景点和公共交通",
        "hotel_budget_ratio": 0.15,
        "flight_budget_ratio": 0.25,
        "attraction_budget_ratio": 0.05,
        "preference_weights": {"美食": 3, "自然": 2, "文化": 1, "购物": 0, "娱乐": 0},
        "hotel_index": 0,  # 选最便宜的酒店
        "flight_index": 0,  # 选最便宜的航班
        "meals": {
        "早餐": [
            {"suggestion": "便利店饭团/面包+牛奶", "price": 30},
            {"suggestion": "吉野家朝定食", "price": 40},
            {"suggestion": "超市寿司便当", "price": 25},
        ],
        "午餐": [
            {"suggestion": "拉面店/快餐定食", "price": 50},
            {"suggestion": "牛丼/咖喱饭", "price": 45},
            {"suggestion": "回转寿司(5碟)", "price": 60},
        ],
        "晚餐": [
            {"suggestion": "居酒屋小食/烤串", "price": 80},
            {"suggestion": "超市便当+关东煮", "price": 50},
            {"suggestion": "大阪烧/章鱼烧", "price": 70},
        ],
    },
    },
    "comfort": {
        "label": "⭐ 舒适版",
        "description": "品质出行，舒适体验，兼顾经典景点与美食",
        "hotel_budget_ratio": 0.30,
        "flight_budget_ratio": 0.30,
        "attraction_budget_ratio": 0.15,
        "preference_weights": {"文化": 3, "美食": 2, "购物": 1, "自然": 1, "娱乐": 0},
        "hotel_index": 1,  # 选中档酒店
        "flight_index": 1,  # 选中间航班
        "meals": {
        "早餐": [
            {"suggestion": "酒店自助早餐/日式定食", "price": 60},
            {"suggestion": "和风朝食+抹茶", "price": 55},
            {"suggestion": "面包咖啡/三明治", "price": 40},
        ],
        "午餐": [
            {"suggestion": "天妇罗定食/鳗鱼饭", "price": 100},
            {"suggestion": "寿司/刺身定食", "price": 120},
            {"suggestion": "荞麦面/亲子丼", "price": 80},
        ],
        "晚餐": [
            {"suggestion": "烤肉放题/和牛烧肉", "price": 200},
            {"suggestion": "怀石料理/会席料理", "price": 250},
            {"suggestion": "居酒屋/寿司名店", "price": 180},
        ],
    },
    },
    "trendy": {
        "label": "📸 网红打卡版",
        "description": "出片第一，潮流体验，打卡最火景点和餐厅",
        "hotel_budget_ratio": 0.35,
        "flight_budget_ratio": 0.30,
        "attraction_budget_ratio": 0.20,
        "preference_weights": {"娱乐": 3, "购物": 3, "美食": 2, "文化": 1, "自然": 0},
        "hotel_index": 2,  # 选最贵的酒店（如果够）
        "flight_index": 2,  # 选最好的航班
        "meals": {
        "早餐": [
            {"suggestion": "网红Brunch/特色咖啡厅", "price": 80},
            {"suggestion": "网红舒芙蕾/松饼", "price": 70},
            {"suggestion": "特色水果三明治+拿铁", "price": 60},
        ],
        "午餐": [
            {"suggestion": "米其林推荐/网红餐厅", "price": 150},
            {"suggestion": "ins风沙拉碗/轻食", "price": 120},
            {"suggestion": "和牛汉堡/创意料理", "price": 130},
        ],
        "晚餐": [
            {"suggestion": "高级餐厅/景观晚餐", "price": 300},
            {"suggestion": "米其林星级餐厅", "price": 350},
            {"suggestion": "屋顶酒吧/夜景餐厅", "price": 280},
        ],
    },
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
    """根据策略生成单版本方案 — 真正差异化三个版本"""
    from app.tools.budget_calculator import calculate_budget

    strat = VERSION_STRATEGIES.get(strategy, VERSION_STRATEGIES["comfort"])

    # ===== 1. 按策略差异化选酒店 =====
    sorted_hotels = sorted(hotels, key=lambda h: h["price_per_night"])
    hotel_idx = min(strat["hotel_index"], len(sorted_hotels) - 1) if sorted_hotels else 0
    selected_hotels = [sorted_hotels[hotel_idx]] if sorted_hotels else hotels

    # ===== 2. 按策略差异化选航班 =====
    sorted_flights = sorted(flights, key=lambda f: f["price"])
    flight_idx = min(strat["flight_index"], len(sorted_flights) - 1) if sorted_flights else 0
    selected_flights = [sorted_flights[flight_idx]] if sorted_flights else flights

    # ===== 3. 按策略差异化选景点 =====
    weights = strat["preference_weights"]
    scored_attractions = []
    for a in attractions:
        # 按策略权重打分，免费景点有加分
        score = weights.get(a["category"], 0) * 10 + (5 if a["ticket_price"] == 0 else 0)
        scored_attractions.append((score, a))
    scored_attractions.sort(key=lambda x: x[0], reverse=True)

    # 每个版本从不同偏移量开始取景点，确保三个版本景点差异明显
    face_offsets = {"budget": 0, "comfort": 3, "trendy": 6}
    face_offset = face_offsets.get(strategy, 0)
    needs = days * 4  # 每天最多4个景点
    selected_attractions = [a for _, a in scored_attractions[face_offset:face_offset + needs]]

    # 如果选出的景点不够，从剩余景点中补充
    if len(selected_attractions) < needs:
        all_selected_names = {a["name"] for a in selected_attractions}
        remaining = [a for _, a in scored_attractions if a["name"] not in all_selected_names]
        selected_attractions += remaining[:needs - len(selected_attractions)]

    # 如果还不够，从头循环补充（确保每天至少2个景点）
    if len(selected_attractions) < days * 2:
        remaining = [a for _, a in scored_attractions if a["name"] not in {s["name"] for s in selected_attractions}]
        selected_attractions += remaining
        # 去重
        seen = set()
        unique = []
        for a in selected_attractions:
            if a["name"] not in seen:
                seen.add(a["name"])
                unique.append(a)
        selected_attractions = unique

    # ===== 4. 按策略差异化餐饮 =====
    version_meals = strat.get("meals", MEAL_SUGGESTIONS.get(destination, DEFAULT_MEALS))

    # ===== 5. 构建行程 =====
    itinerary = build_itinerary(
        flights=selected_flights,
        hotels=selected_hotels,
        attractions=selected_attractions,
        days=days,
        destination=destination,
        selected_flight_index=0,
        selected_hotel_index=0,
        meals_input=version_meals,
    )

    # ===== 6. 计算预算 =====
    # 计算一天三餐总价（取每种餐的第1个选项）
    daily_meal_cost = 0
    for meal_type in ["早餐", "午餐", "晚餐"]:
        meal_opts = version_meals.get(meal_type, [{"price": 0}])
        daily_meal_cost += meal_opts[0]["price"] if isinstance(meal_opts, list) else meal_opts.get("price", 0)
    budget_breakdown = calculate_budget(
        flights=selected_flights,
        hotels=selected_hotels,
        attractions=selected_attractions,
        days=days,
        meals_per_day=daily_meal_cost,
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
    """生成多版本方案对比（省钱版/舒适版/网红版）"""
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