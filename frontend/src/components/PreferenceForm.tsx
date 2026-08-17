import { useState } from 'react'

interface PreferenceFormProps {
  onBack: () => void
  onSubmit: (prefs: any) => void
}

const STYLE_OPTIONS = [
  { value: 'photo', label: '📸 网红打卡' },
  { value: 'history', label: '🏯 历史古迹' },
  { value: 'food', label: '🌃 夜市美食' },
  { value: 'nature', label: '🏖️ 自然风光' },
  { value: 'shopping', label: '🛍️ 购物血拼' },
  { value: 'theme_park', label: '🎢 主题乐园' },
  { value: 'culture', label: '🎭 文化艺术' },
  { value: 'relax', label: '🧘 休闲养生' },
  { value: 'drive', label: '🚗 自驾出行' },
  { value: 'outdoor', label: '🏕️ 户外探险' },
]

const TRANSPORT_OPTIONS = [
  { value: 'public', label: '🚇 公共交通' },
  { value: 'taxi', label: '🚕 打车为主' },
  { value: 'drive', label: '🚗 自驾' },
  { value: 'bike', label: '🚲 骑行' },
]

const HOTEL_OPTIONS = [
  { value: 'budget', label: '🏨 经济型' },
  { value: 'comfort', label: '🏢 舒适型' },
  { value: 'luxury', label: '🏰 豪华型' },
  { value: 'bnb', label: '🏡 民宿' },
  { value: 'parking', label: '🅿️ 需停车位' },
  { value: 'wifi', label: '📶 免费WiFi' },
  { value: 'breakfast', label: '🍳 含早餐' },
]

const PACE_OPTIONS = [
  { value: 'slow', label: '🐢 轻松漫游' },
  { value: 'moderate', label: '🚶 适中节奏' },
  { value: 'fast', label: '🏃 紧凑高效' },
]

export default function PreferenceForm({ onBack, onSubmit }: PreferenceFormProps) {
  const [styles, setStyles] = useState<string[]>([])
  const [transportPref, setTransportPref] = useState('public')
  const [hotelPref, setHotelPref] = useState<string[]>([])
  const [pace, setPace] = useState('moderate')

  const toggleTag = (value: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">偏好设置</h3>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">🎯 旅行风格（多选）</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleTag(opt.value, styles, setStyles)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                styles.includes(opt.value)
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">🚗 交通偏好</label>
        <div className="flex gap-2">
          {TRANSPORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTransportPref(opt.value)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                transportPref === opt.value
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">🏨 住宿偏好</label>
        <div className="flex flex-wrap gap-2">
          {HOTEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleTag(opt.value, hotelPref, setHotelPref)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                hotelPref.includes(opt.value)
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">⏱️ 行程节奏</label>
        <div className="flex gap-3">
          {PACE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPace(opt.value)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                pace === opt.value
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          ← 上一步
        </button>
        <button
          onClick={() => onSubmit({ styles, transportPref, hotelPref, pace })}
          className="flex-[2] bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          🚀 生成行程方案
        </button>
      </div>
    </div>
  )
}