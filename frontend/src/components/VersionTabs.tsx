import { useState } from 'react'

interface Version {
  id: string
  label: string
  description: string
  budget: { total: number }
  itinerary: Array<{
    day: number
    date: string
    activities: Array<{ name: string; time: string; category: string }>
    hotel: string
  }>
}

interface VersionTabsProps {
  versions: Version[]
}

export default function VersionTabs({ versions }: VersionTabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  if (!versions || versions.length === 0) return null

  const active = versions[activeTab]

  return (
    <div className="my-3 border border-gray-200 rounded-xl overflow-hidden">
      {/* 版本切换 */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {versions.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActiveTab(i)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              i === activeTab
                ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div>{v.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{v.description}</div>
          </button>
        ))}
      </div>

      {/* 预算总览 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-blue-400 font-medium">{active.label}</div>
          <div className="text-2xl font-bold text-blue-600">
            ¥{active.budget.total.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 行程概览 */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {active.itinerary.map((day) => (
          <div key={day.day} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {day.date}
              <span className="text-xs text-gray-400 ml-2">🏨 {day.hotel}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {day.activities.map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {act.time}: {act.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}