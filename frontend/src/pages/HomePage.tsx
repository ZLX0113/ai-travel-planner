import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-14 md:pb-0">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-500 py-16 md:py-24 text-center text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">✈️ 旅行规划师</h1>
        <p className="text-sm md:text-base opacity-90 mb-8">智能规划你的每一次旅行 · 从航班到景点，一站搞定</p>
        <SearchBar />
      </div>

      {/* 快速入口 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">快速规划</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/search?q=东京')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-center"
          >
            <div className="text-3xl mb-2">🗼</div>
            <div className="text-sm font-medium text-gray-700">东京</div>
            <div className="text-xs text-gray-400">日本</div>
          </button>
          <button
            onClick={() => navigate('/search?q=巴黎')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-center"
          >
            <div className="text-3xl mb-2">🗼</div>
            <div className="text-sm font-medium text-gray-700">巴黎</div>
            <div className="text-xs text-gray-400">法国</div>
          </button>
          <button
            onClick={() => navigate('/search?q=纽约')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-center"
          >
            <div className="text-3xl mb-2">🗽</div>
            <div className="text-sm font-medium text-gray-700">纽约</div>
            <div className="text-xs text-gray-400">美国</div>
          </button>
          <button
            onClick={() => navigate('/search?q=曼谷')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-center"
          >
            <div className="text-3xl mb-2">🍜</div>
            <div className="text-sm font-medium text-gray-700">曼谷</div>
            <div className="text-xs text-gray-400">泰国</div>
          </button>
        </div>
      </div>
    </div>
  )
}