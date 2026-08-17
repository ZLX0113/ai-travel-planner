import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import ItineraryPage from './pages/ItineraryPage'
import ComparePage from './pages/ComparePage'
import ChatPage from './pages/ChatPage'
import SearchResultPage from './pages/SearchResultPage'
import DesktopNav from './components/DesktopNav'
import MobileNav from './components/MobileNav'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/itinerary/:id" element={<ItineraryPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/search" element={<SearchResultPage />} />
      </Routes>
      <MobileNav />
    </div>
  )
}