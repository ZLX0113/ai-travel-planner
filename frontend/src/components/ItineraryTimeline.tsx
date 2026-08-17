import type { DayPlan, TimeNode, FlightDetail, TransitDetail, AttractionDetail } from '../types'

const TYPE_ICONS: Record<string, string> = {
  flight: '✈️', transit: '🚇', attraction: '📍', meal: '🍽️', rest: '🏨',
}

const TYPE_COLORS: Record<string, string> = {
  flight: '#2563eb', transit: '#f59e0b', attraction: '#10b981', meal: '#ef4444', rest: '#8b5cf6',
}

interface Props {
  day: DayPlan
  onAttractionClick: (node: TimeNode) => void
}

export default function ItineraryTimeline({ day, onAttractionClick }: Props) {
  return (
    <div className="space-y-0">
      <div className="text-sm text-gray-400 mb-4">
        📅 {day.date} · {day.weather?.condition || '晴'} {day.weather?.temp || '25°C'}
      </div>

      {day.nodes.map((node, i) => (
        <div key={i} className="flex gap-3 pb-4">
          <div className="w-14 text-right text-sm font-bold text-blue-600 pt-0.5 flex-shrink-0">
            {node.time}
          </div>

          <div className="relative flex flex-col items-center">
            <div
              className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: TYPE_COLORS[node.type] || '#999' }}
            />
            {i < day.nodes.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{TYPE_ICONS[node.type] || '📍'}</span>
              <span
                className={`font-semibold text-sm ${node.type === 'attraction' ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
                onClick={() => node.type === 'attraction' && onAttractionClick(node)}
              >
                {node.title}
              </span>
              {node.category && (
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs">
                  {node.category}
                </span>
              )}
            </div>

            {node.type === 'flight' && node.detail && (() => {
              const d = node.detail as FlightDetail
              return (
                <div className="text-xs text-gray-500 space-y-0.5 ml-8">
                  <div>🛫 {d.flightNo} · {d.airline}</div>
                  <div>🛬 {d.departureTime} → {d.arrivalTime} · {d.duration}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-orange-600 font-medium">¥{d.price}</span>
                    <span>{d.baggage}</span>
                    {d.seatsLeft > 0 && d.seatsLeft <= 5 && (
                      <span className="text-red-500">🔥 仅剩{d.seatsLeft}座</span>
                    )}
                  </div>
                </div>
              )
            })()}

            {node.type === 'transit' && node.detail && (() => {
              const d = node.detail as TransitDetail
              return (
                <div className="text-xs text-gray-500 ml-8">
                  <span>🕐 {d.duration}</span>
                  <span className="mx-2">|</span>
                  <span>💰 ¥{d.price}</span>
                </div>
              )
            })()}

            {node.type === 'attraction' && node.detail && (() => {
              const d = node.detail as AttractionDetail
              return (
                <div className="text-xs text-gray-500 space-y-0.5 ml-8">
                  <div>🕐 建议游玩 {d.suggestedDuration}</div>
                  <div>
                    🎫 {d.free ? '免费' : `¥${d.ticketPrice}`}
                    <span className="mx-2">|</span>
                    🕐 {d.openingHours}
                  </div>
                  {d.needBooking && (
                    <div className="text-orange-500">⚠️ 需要提前预约</div>
                  )}
                  {d.closingDay && (
                    <div className="text-red-400">📅 闭馆日：{d.closingDay}</div>
                  )}
                  <span
                    className="text-blue-600 cursor-pointer underline text-xs"
                    onClick={() => onAttractionClick(node)}
                  >
                    📷 查看详情与图片
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
      ))}
    </div>
  )
}