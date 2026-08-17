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
    meals_per_day: int = 0,
) -> BudgetBreakdown:
    """根据搜索结果计算旅行预算明细"""
    # 机票（往返，每人）
    flight_cost = 0
    if flights and selected_flight_index < len(flights):
        flight_cost = flights[selected_flight_index]["price"] * 2 * travelers

    # 酒店（天数-1 晚）
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
        count = min(len(attractions), days * 2)
        for a in attractions[:count]:
            attraction_cost += a["ticket_price"] * travelers

    # 餐饮（如果指定了 meals_per_day 则用指定值）
    meal_cost = (meals_per_day if meals_per_day else MEAL_COST_PER_DAY) * days * travelers

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