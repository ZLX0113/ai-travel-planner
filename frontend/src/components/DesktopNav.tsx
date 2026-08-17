import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/plan', label: '规划行程', icon: '📋' },
  { path: '/chat', label: 'AI 对话', icon: '💬' },
  { path: '/compare', label: '方案对比', icon: '📊' },
]

export default function DesktopNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition"
      >
        <span>✈️</span>
        <span>旅行规划师</span>
      </button>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}