import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { DayPlan, BudgetBreakdown } from '../types'

const VERSION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  budget: { bg: '#10b981', text: '#10b981', border: 'border-emerald-500' },
  comfort: { bg: '#2563eb', text: '#2563eb', border: 'border-blue-600' },
  trendy: { bg: '#8b5cf6', text: '#8b5cf6', border: 'border-purple-500' },
}

const VERSION_LABELS: Record<string, string> = {
  budget: '💰 省钱版',
  comfort: '⭐ 舒适版',
  trendy: '📸 网红打卡版',
}

interface VersionData {
  id: string
  label: string
  description: string
  itinerary: DayPlan[]
  budget: BudgetBreakdown
}

export default function ComparePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [versions, setVersions] = useState<VersionData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    const request = location.state?.request
    const destination = request?.destination || '东京'
    const days = request ? Math.ceil(
      (new Date(request.returnDate).getTime() - new Date(request.departureDate).getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1 : 3
    const budget = parseInt(request?.budget?.replace(/[^0-9]/g, '').split('-')[0] || '8000')

    try {
      const response = await fetch('/api/trip/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, budget }),
      })
      const data = await response.json()
      if (data.versions && Array.isArray(data.versions)) {
        setVersions(data.versions)
      }
    } catch (err) {
      console.error('获取方案失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📊</div>
          <div className="text-gray-500">正在生成多方案对比...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-800 text-center">📊 多方案对比</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {versions.map((v, i) => {
            const colors = VERSION_COLORS[v.id] || VERSION_COLORS.comfort
            return (
              <div
                key={i}
                className={`bg-white rounded-xl border-2 ${colors.border} overflow-hidden shadow-sm hover:shadow-md transition`}
              >
                <div className="text-white text-sm font-bold px-4 py-2.5" style={{ backgroundColor: colors.bg }}>
                  {VERSION_LABELS[v.id] || v.label}
                  {v.id === 'comfort' && <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded text-xs">推荐</span>}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-3">{v.description}</p>
                  <div className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                    ¥{v.budget?.total?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between"><span>✈️ 机票</span><span>¥{((v.budget as any)?.flights || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>🏨 酒店</span><span>¥{((v.budget as any)?.hotels || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>🎫 门票</span><span>¥{((v.budget as any)?.attractions || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>🍽️ 餐饮</span><span>¥{((v.budget as any)?.meals || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>🚇 交通</span><span>¥{((v.budget as any)?.transport || 0).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 对比表格 */}
        {versions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">对比项</th>
                    {versions.map((v, i) => (
                      <th key={i} className="text-center px-4 py-3 font-semibold" style={{ color: VERSION_COLORS[v.id]?.text }}>
                        {VERSION_LABELS[v.id] || v.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: '💰 总价', key: 'total' },
                    { label: '✈️ 机票', key: 'flights' },
                    { label: '🏨 酒店', key: 'hotels' },
                    { label: '🎫 门票', key: 'attractions' },
                    { label: '🍽️ 餐饮', key: 'meals' },
                    { label: '🚇 交通', key: 'transport' },
                  ].map((row) => (
                    <tr key={row.key}>
                      <td className="px-4 py-3 font-medium text-gray-600">{row.label}</td>
                      {versions.map((v, i) => (
                        <td key={i} className="text-center px-4 py-3 text-gray-700">
                          ¥{((v.budget as any)?.[row.key] || 0).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 每日行程对比 */}
        {versions.length > 0 && versions[0].itinerary?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800">📅 每日行程对比</h2>
            {Array.from({ length: versions[0].itinerary.length }, (_, dayIdx) => (
              <div key={dayIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
                  onClick={() => {
                    const key = `day-${dayIdx}`
                    setExpandedDay(prev => ({
                      ...prev,
                      [key]: prev[key] === dayIdx ? -1 : dayIdx,
                    }))
                  }}
                >
                  <span>Day {dayIdx + 1}</span>
                  <span className="text-gray-400 text-xs">{expandedDay[`day-${dayIdx}`] === dayIdx ? '收起 ▲' : '展开 ▼'}</span>
                </button>
                {expandedDay[`day-${dayIdx}`] === dayIdx && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2 font-medium text-gray-500 w-20">时间</th>
                          {versions.map((v, vi) => (
                            <th key={vi} className="text-left px-4 py-2 font-medium" style={{ color: VERSION_COLORS[v.id]?.text }}>
                              {VERSION_LABELS[v.id] || v.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {versions[0].itinerary[dayIdx]?.nodes?.map((node, nodeIdx) => (
                          <tr key={nodeIdx}>
                            <td className="px-4 py-2 text-gray-500 text-xs">{node.time}</td>
                            {versions.map((v, vi) => {
                              const vNode = v.itinerary[dayIdx]?.nodes?.[nodeIdx]
                              return (
                                <td key={vi} className="px-4 py-2">
                                  {vNode ? (
                                    <div>
                                      <span className="text-sm font-medium">{vNode.title}</span>
                                      {vNode.type === 'attraction' && vNode.detail && (
                                        <div className="text-xs text-gray-400 mt-0.5">
                                          🎫 {(vNode.detail as any).free ? '免费' : `¥${(vNode.detail as any).ticketPrice}`}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}