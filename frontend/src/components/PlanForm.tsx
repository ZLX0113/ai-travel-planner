import { useState } from 'react'

interface PlanFormProps {
  initialDestination?: string
  onNext: (data: any) => void
}

export default function PlanForm({ initialDestination = '', onNext }: PlanFormProps) {
  const [origin, setOrigin] = useState('北京')
  const [destination, setDestination] = useState(initialDestination)
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [seniors, setSeniors] = useState(0)
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([])
  const [budget, setBudget] = useState('¥5,000-8,000')

  const BUDGET_OPTIONS = ['¥5,000-8,000', '¥8,000-15,000', '¥15,000+', '自定义']
  const SPECIAL_OPTIONS = [
    { value: 'infant', label: '👶 有婴幼儿（0-3岁）' },
    { value: 'child', label: '👧 有儿童（4-12岁）' },
    { value: 'senior', label: '👴 有老人（60+）' },
    { value: 'pregnant', label: '🤰 有孕妇' },
    { value: 'accessible', label: '♿ 无障碍需求' },
  ]

  const toggleSpecial = (value: string) => {
    setSpecialNeeds((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleSubmit = () => {
    onNext({
      origin, destination, departureDate, returnDate,
      adults, children, seniors, specialNeeds, budget,
    })
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">基本信息</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">📍 出发地</label>
          <input
            type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">📍 目的地</label>
          <input
            type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="输入城市名"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">📅 出发日期</label>
          <input
            type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">📅 返程日期</label>
          <input
            type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">👥 出行人数</label>
        <div className="flex gap-4">
          {[
            { label: '成人', value: adults, set: setAdults },
            { label: '儿童', value: children, set: setChildren },
            { label: '老人', value: seniors, set: setSeniors },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500">{item.label}</span>
              <span className="font-bold text-base">{item.value}</span>
              <button
                onClick={() => item.set(Math.max(0, item.value - 1))}
                className="text-blue-600 text-lg leading-none"
              >−</button>
              <button
                onClick={() => item.set(item.value + 1)}
                className="text-blue-600 text-lg leading-none"
              >+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">⚠️ 特殊人群关怀（可选）</label>
        <div className="flex flex-wrap gap-3">
          {SPECIAL_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox" checked={specialNeeds.includes(opt.value)}
                onChange={() => toggleSpecial(opt.value)}
                className="accent-blue-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">💰 预算范围（每人）</label>
        <div className="flex gap-2 flex-wrap">
          {BUDGET_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setBudget(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                budget === opt
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!destination || !departureDate || !returnDate}
        className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        下一步：选择偏好 →
      </button>
    </div>
  )
}