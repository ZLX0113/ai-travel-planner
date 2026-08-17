# 旅行规划师 v2.0 — 产品设计文档

> 状态：已确认  
> 日期：2026-08-15  
> 从 Demo 到可交付产品，覆盖 PC 端和手机端的智能旅行规划工具

---

## 1. 产品定位

**旅行规划师**是一款面向普通消费者的旅行规划工具。用户填写出行需求（出发地、目的地、日期、人数、偏好），系统自动生成包含**真实交通数据、精确时间轴、通勤路线、酒店智能匹配、景点详情图片**的详细行程方案，支持多方案对比。

与通用 LLM 对话的本质区别：不是"给建议"，而是"做执行"——调真实 API 拿数据、做约束校验、结构化输出可执行方案。

### 1.2 目标用户

- 自由行规划者（学生、情侣、家庭、老年团）
- 嫌查攻略麻烦的普通旅客
- 需要快速对比多个方案的决策者

### 1.3 平台

- PC 端（1440px+）
- 手机端（375px+ 响应式）

---

## 2. 核心功能模块

### 2.1 首页 & 搜索

- **搜索栏**：输入城市、国家、景点名、酒店名，模糊匹配
- **热门目的地**：标签形式展示热门城市，点击快速进入
- **快速规划入口**：一键跳转规划表单

### 2.2 规划表单（三步向导）

**步骤 1：基本信息**
- 出发地 / 目的地（城市级搜索）
- 出发日期 / 返程日期
- 出行人数：成人 / 儿童 / 老人（精确到人头）
- 特殊人群关怀：婴幼儿(0-3岁) / 儿童(4-12岁) / 老人(60+) / 孕妇 / 无障碍需求（多选）
- 预算范围：¥5,000-8,000 / ¥8,000-15,000 / ¥15,000+ / 自定义

**步骤 2：偏好设置（多选标签）**
- 旅行风格：网红打卡、历史古迹、夜市美食、自然风光、购物血拼、主题乐园、文化艺术、休闲养生、自驾出行、户外探险
- 交通偏好：公共交通、打车为主、自驾、骑行
- 住宿偏好：经济型、舒适型、豪华型、民宿、需停车位、免费WiFi、含早餐
- 行程节奏：轻松漫游、适中节奏、紧凑高效

**步骤 3：确认提交**
- 汇总所有选择，点击生成行程

### 2.3 行程展示（核心页面）

**布局：左侧时间轴 + 右侧地图**

**时间轴（精确到小时）：**
- 每个节点显示：时间、活动类型图标、名称、类别标签
- 交通节点：具体航班号/车次、出发/到达时间、票价、余票
- 景点节点：建议游玩时长、门票价格、开放时间、闭馆日、预约要求
- 点击景点 → 弹出详情卡片（大图 + 完整信息）

**通勤路线（景点间）：**
- 每个景点间标注：交通方式、耗时、费用
- 点击展开通勤方案对比：公交 / 地铁 / 打车 / 自驾 / 骑行，各自耗时和费用
- 自驾模式：标注停车位、高速路线、服务区

**交互式地图（右侧）：**
- 标注全天所有景点位置
- 彩色虚线连接当天路线
- 点击 Marker 弹出简要信息
- 图例：机场 / 景点 / 餐饮 / 交通

**酒店卡片：**
- 根据每日动线自动推荐最优区域酒店
- 显示：图片、名称、星级、地址、距地铁距离、标签（停车位/WiFi/早餐）、价格
- 价位区间筛选标签

**景点详情弹窗：**
- 大图展示（接入 Unsplash / Google Places API）
- 门票、开放时间、闭馆日、预约要求、评分
- 到达方式（多种交通选项）
- 游玩提示
- 标签：网红打卡、免费、热门等

**图片展示：**
- 行程中每个景点附带实景图片
- 酒店附带外观/房间图片
- 图片源：Unsplash API / Google Places Photos / 预设图片库

### 2.4 多方案对比

- 三方案并列展示：省钱版 / 舒适版（推荐） / 网红打卡版
- 顶部汇总卡片：总价、航班、酒店、餐饮、交通方式概览
- 详细对比表：航班班次+价格、酒店星级+价格+标签、交通方式+费用、景点门票、每日行程逐项
- 每个方案可点击展开完整行程
- 手机端：横向滑动卡片

### 2.5 跨城市交通

- 自动匹配高铁/大巴/航班班次
- 合理安排城市间移动时间，杜绝一天长时间赶路
- 标注班次、耗时、票价

### 2.6 自驾版本

- 规划停车位置
- 高速路线推荐
- 服务区停靠点
- 每日动线对应酒店（按当天最后景点位置就近推荐）

### 2.7 PDF 导出

- 一键导出为 PDF 文件
- 包含完整行程、预算、地图截图

---

## 3. 数据模型

### 3.1 用户输入

```
TravelRequest {
  origin: string           // 出发地
  destination: string      // 目的地
  departure_date: date     // 出发日期
  return_date: date        // 返程日期
  adults: int              // 成人数量
  children: int            // 儿童数量
  seniors: int             // 老人数量
  special_needs: string[]  // [infant, child, senior, pregnant, accessible]
  budget: BudgetRange      // 预算范围
  styles: string[]         // 旅行风格标签
  transport_pref: string   // 交通偏好
  hotel_pref: string[]     // 住宿偏好标签
  pace: string             // 行程节奏
}
```

### 3.2 行程数据

```
Itinerary {
  id: string
  version: string          // budget / comfort / premium
  destination: string
  days: DayPlan[]
  total_budget: BudgetBreakdown
  created_at: datetime
}

DayPlan {
  day: int
  date: string
  weather: WeatherInfo
  nodes: TimeNode[]        // 有序时间节点
  hotel: HotelInfo
}

TimeNode {
  time: string             // "06:00"
  type: enum               // flight / transit / attraction / meal / rest
  title: string
  category: string          // 历史古迹 / 购物 / 美食 / 网红打卡
  detail: FlightDetail | TransitDetail | AttractionDetail | MealDetail
}

FlightDetail {
  flight_no: string        // CA123
  airline: string          // 中国国航
  departure_time: string
  arrival_time: string
  duration: string         // 3h30min
  price: decimal
  departure_airport: string
  arrival_airport: string
  baggage: string          // 含20kg行李
  seats_left: int
}

TransitDetail {
  mode: string             // subway / bus / taxi / drive / bike
  route: string            // 浅草→秋叶原 银座线
  duration: string
  price: decimal
  alternatives: TransitOption[]  // 其他方案对比
}

AttractionDetail {
  name: string
  images: string[]         // 图片URL
  ticket_price: decimal
  free: boolean
  opening_hours: string
  closing_day: string
  need_booking: boolean
  rating: decimal
  review_count: int
  suggested_duration: string
  how_to_get: TransitOption[]
  tips: string
  tags: string[]
}

HotelInfo {
  name: string
  images: string[]
  star: decimal
  address: string
  price_per_night: decimal
  distance_to_station: string
  tags: string[]           // 停车场 / WiFi / 早餐 / 近地铁
  match_reason: string     // 根据动线推荐的理由
}
```

---

## 4. 技术架构

### 4.1 前端

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| react-leaflet | 地图组件 |
| html2pdf.js | PDF 导出 |
| react-router-dom | 路由 |

**新增页面：**
- `/` — 首页（搜索 + 热门目的地）
- `/plan` — 规划表单（三步向导）
- `/itinerary/:id` — 行程详情页（时间轴 + 地图 + 景点弹窗）
- `/compare/:id` — 多方案对比页

### 4.2 后端

| 技术 | 用途 |
|------|------|
| FastAPI | API 框架 |
| LangGraph | Agent 编排 |
| OpenAI SDK | LLM 调用 |
| ChromaDB | 向量库（RAG 知识库） |

**新增 API 端点：**

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/search` | GET | 搜索城市/景点/酒店 |
| `/api/trip/plan` | POST | 生成行程（SSE 流式） |
| `/api/trip/versions` | POST | 生成多方案（SSE 流式） |
| `/api/trip/modify` | POST | 修改行程 |
| `/api/trip/:id` | GET | 获取行程详情 |
| `/api/attraction/:id` | GET | 获取景点详情（含图片） |
| `/api/health` | GET | 健康检查 |

### 4.3 外部 API

| API | 用途 |
|------|------|
| Amadeus / Skyscanner | 真实航班数据 |
| Google Places / Unsplash | 景点图片 |
| 高德/Google Maps | 路线规划、通勤耗时 |
| 12306 / 高铁 API | 火车票务数据 |
| 天气 API | 每日天气联动 |

---

## 5. 与 v1 的关键差异

| 维度 | v1 | v2 |
|------|-----|-----|
| 交通数据 | Mock 假数据 | 真实 API 实时数据 |
| 时间精度 | 模糊描述 | 精确到小时 |
| 景点间通勤 | 无 | 多模式对比（公交/地铁/打车/自驾） |
| 酒店推荐 | 随机 | 按每日动线智能匹配 |
| 图片 | 无 | 景点+酒店实景图片 |
| 平台 | 仅 PC | PC + 手机端响应式 |
| 搜索 | 无 | 城市/景点/酒店搜索 |
| 用户输入 | 简单文字 | 结构化表单（人数/特殊人群/偏好） |
| 多方案 | 简单对比 | 逐项详细对比（航班/酒店/行程） |
| 自驾 | 不支持 | 停车位/高速/服务区 |
| 景点预约 | 无 | 自动识别预约/限购/闭馆 |
| 产品名 | AI 旅行规划师 | 旅行规划师 |

---

## 6. 非功能性需求

- 响应式设计：PC 端 1440px+，手机端 375px+
- SSE 流式推送：搜索搜到即展示，不等待全部完成
- 图片懒加载：景点图片按需加载
- 地图性能：大规模 Marker 使用聚类
- 无障碍：表单支持键盘操作，图片有 alt 文本

---

> 下一步：编写实施计划（writing-plans）