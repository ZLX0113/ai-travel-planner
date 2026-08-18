import { useState, useEffect, useRef } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import TripMap from '../components/TripMap'
import ItineraryTimeline from '../components/ItineraryTimeline'
import AttractionModal from '../components/AttractionModal'
import HotelCard from '../components/HotelCard'
import type { Itinerary, DayPlan, TimeNode, BudgetBreakdown } from '../types'

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [currentDay, setCurrentDay] = useState(0)
  const [selectedNode, setSelectedNode] = useState<TimeNode | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const request = location.state?.request
    if (id === 'new' && request) {
      generateItinerary(request)
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [id, location.state])

  const generateItinerary = async (request: any) => {
    setLoading(true)
    const destination = request.destination || ''
    const departure = request.origin || '北京'
    const days = Math.ceil(
      (new Date(request.returnDate).getTime() - new Date(request.departureDate).getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1
    const budget = parseInt(request.budget?.replace(/[^0-9]/g, '').split('-')[0] || '8000')

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const response = await fetch('/api/trip/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, departure, days, budget }),
        signal: controller.signal,
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let dayPlans: DayPlan[] = []
          let totalBudget: BudgetBreakdown = { flights: 0, hotels: 0, attractions: 0, meals: 0, transport: 0, insurance: 0, misc: 0, total: 0 }

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.status === 'itinerary' && event.data) {
                // data.data 是 DayPlan[] 数组
                dayPlans = event.data
                setItinerary({
                  id: 'new',
                  version: 'v1',
                  destination,
                  days: dayPlans,
                  totalBudget,
                  createdAt: new Date().toISOString(),
                })
              } else if (event.status === 'budget' && event.total) {
                totalBudget = event.breakdown
                setItinerary(prev => prev ? { ...prev, totalBudget } : null)
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('生成行程失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!contentRef.current) return
    const element = contentRef.current.cloneNode(true) as HTMLElement
    // 移除 sticky 元素避免 PDF 中重复
    element.querySelectorAll('.sticky').forEach(el => (el as HTMLElement).style.position = 'static')
    const opt = {
      margin: 10,
      filename: `${itinerary?.destination || '行程'}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleCompare = () => {
    const request = location.state?.request
    if (request) {
      navigate('/compare', { state: { request } })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">✈️</div>
          <div className="text-gray-500">正在生成行程...</div>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-14 md:pb-0 gap-4">
        <p className="text-gray-400">未找到行程数据</p>
        <button onClick={() => navigate('/plan')} className="text-blue-600 hover:underline text-sm">前往规划行程</button>
      </div>
    )
  }

  if (!itinerary.days?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-14 md:pb-0 gap-4">
        <p className="text-gray-400">行程数据为空</p>
        <button onClick={() => navigate('/plan')} className="text-blue-600 hover:underline text-sm">重新规划</button>
      </div>
    )
  }

  const currentDayPlan = itinerary.days[currentDay]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-800">🗺️ {itinerary.destination}</h1>
            <span className="text-orange-600 font-bold text-sm">💰 ¥{itinerary.totalBudget?.total?.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
            >
              📄 导出 PDF
            </button>
            <button
              onClick={handleCompare}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              📊 多方案对比
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {itinerary.days.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentDay(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                currentDay === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div ref={contentRef} className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <ItineraryTimeline day={currentDayPlan} onAttractionClick={(node) => setSelectedNode(node)} />
            {currentDayPlan.hotel && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-700 mb-3">🏨 今晚住宿</div>
                <HotelCard hotel={currentDayPlan.hotel} />
              </div>
            )}
          </div>

          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-20">
              <TripMap key={currentDay} itinerary={[currentDayPlan]} destination={itinerary.destination} />
              {itinerary.totalBudget && (
                <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">💰 预算明细</div>
                  <div className="space-y-1.5 text-xs text-gray-500">
                    {itinerary.totalBudget.flights > 0 && (
                      <div className="flex justify-between"><span>✈️ 机票</span><span>¥{itinerary.totalBudget.flights.toLocaleString()}</span></div>
                    )}
                    {itinerary.totalBudget.hotels > 0 && (
                      <div className="flex justify-between"><span>🏨 酒店</span><span>¥{itinerary.totalBudget.hotels.toLocaleString()}</span></div>
                    )}
                    {itinerary.totalBudget.attractions > 0 && (
                      <div className="flex justify-between"><span>🎫 门票</span><span>¥{itinerary.totalBudget.attractions.toLocaleString()}</span></div>
                    )}
                    {itinerary.totalBudget.meals > 0 && (
                      <div className="flex justify-between"><span>🍽️ 餐饮</span><span>¥{itinerary.totalBudget.meals.toLocaleString()}</span></div>
                    )}
                    {itinerary.totalBudget.transport > 0 && (
                      <div className="flex justify-between"><span>🚇 交通</span><span>¥{itinerary.totalBudget.transport.toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-gray-800 pt-1.5 border-t border-gray-100">
                      <span>总计</span><span>¥{itinerary.totalBudget.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (
        <AttractionModal node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  )
}