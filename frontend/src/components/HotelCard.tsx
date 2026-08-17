import type { HotelInfo } from '../types'

interface Props {
  hotel: HotelInfo
}

export default function HotelCard({ hotel }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-100 flex-shrink-0 flex items-center justify-center">
          {hotel.images && hotel.images.length > 0 ? (
            <img
              src={hotel.images[0]} alt={hotel.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-3xl">🏨</span>
          )}
        </div>

        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-800">{hotel.name}</h4>
            <span className="text-yellow-500 text-xs">⭐{hotel.star}</span>
          </div>
          <div className="text-xs text-gray-500 mb-1">📍 {hotel.address}</div>
          <div className="text-xs text-gray-500 mb-2">🚇 {hotel.distanceToStation}</div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {hotel.tags?.map((tag, i) => (
                <span key={i} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs">{tag}</span>
              ))}
            </div>
            <span className="text-orange-600 font-bold text-sm ml-auto">¥{hotel.pricePerNight}/晚</span>
          </div>
          {hotel.matchReason && (
            <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              🎯 {hotel.matchReason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}