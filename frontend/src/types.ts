// 旅行请求
export interface TravelRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate: string
  adults: number
  children: number
  seniors: number
  specialNeeds: string[]
  budget: string
  styles: string[]
  transportPref: string
  hotelPref: string[]
  pace: string
}

// 通勤方案
export interface TransitOption {
  mode: string
  route: string
  duration: string
  price: number
}

// 通勤详情
export interface TransitDetail {
  mode: string
  route: string
  duration: string
  price: number
  alternatives: TransitOption[]
}

// 航班详情
export interface FlightDetail {
  flightNo: string
  airline: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  departureAirport: string
  arrivalAirport: string
  baggage: string
  seatsLeft: number
}

// 景点详情
export interface AttractionDetail {
  name: string
  images: string[]
  ticketPrice: number
  free: boolean
  openingHours: string
  closingDay: string
  needBooking: boolean
  rating: number
  reviewCount: number
  suggestedDuration: string
  howToGet: TransitOption[]
  tips: string
  tags: string[]
}

// 酒店信息
export interface HotelInfo {
  name: string
  images: string[]
  star: number
  address: string
  pricePerNight: number
  distanceToStation: string
  tags: string[]
  matchReason: string
}

// 时间节点
export interface TimeNode {
  time: string
  type: 'flight' | 'transit' | 'attraction' | 'meal' | 'rest'
  title: string
  category: string
  detail: FlightDetail | TransitDetail | AttractionDetail | null
}

// 单日行程
export interface DayPlan {
  day: number
  date: string
  weather: { condition: string; temp: string }
  nodes: TimeNode[]
  hotel: HotelInfo
}

// 预算
export interface BudgetBreakdown {
  flights: number
  hotels: number
  attractions: number
  meals: number
  transport: number
  insurance: number
  misc: number
  total: number
}

// 完整行程
export interface Itinerary {
  id: string
  version: string
  destination: string
  days: DayPlan[]
  totalBudget: BudgetBreakdown
  createdAt: string
}

// 消息（保留兼容）
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  versions?: any[]
  itinerary?: any[]
  destination?: string
}