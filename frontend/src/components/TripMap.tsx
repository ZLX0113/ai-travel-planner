import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import type { DayPlan } from '../types'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Attraction coordinates — 覆盖所有城市景点
const ATTRACTION_COORDS: Record<string, [number, number]> = {
  // 东京
  "浅草寺": [35.7148, 139.7967], "秋叶原": [35.7023, 139.7745],
  "筑地市场": [35.6654, 139.7707], "涩谷十字路口": [35.6595, 139.7004],
  "东京迪士尼乐园": [35.6329, 139.8804], "明治神宫": [35.6764, 139.6993],
  "新宿御苑": [35.6852, 139.7100], "银座": [35.6717, 139.7650],
  // 大阪
  "大阪城": [34.6873, 135.5259], "道顿堀": [34.6687, 135.5013],
  "环球影城": [34.6654, 135.4323], "心斋桥": [34.6725, 135.4998],
  "通天阁": [34.6525, 135.5063], "大阪海游馆": [34.6545, 135.4289],
  "梅田蓝天大厦": [34.7054, 135.4902], "四天王寺": [34.6539, 135.5152],
  // 曼谷
  "大皇宫": [13.7500, 100.4914], "恰图恰周末市场": [13.8000, 100.5510],
  "考山路": [13.7588, 100.4974], "卧佛寺": [13.7465, 100.4930],
  "暹罗天地": [13.7265, 100.5099], "郑王庙": [13.7437, 100.4888],
  "丹嫩沙多水上市场": [13.5420, 99.9570], "拉差达火车夜市": [13.7669, 100.5695],
  // 巴黎
  "埃菲尔铁塔": [48.8584, 2.2945], "卢浮宫": [48.8606, 2.3376],
  "香榭丽舍大街": [48.8698, 2.3075], "蒙马特高地": [48.8867, 2.3431],
  "塞纳河游船": [48.8638, 2.3034], "玛黑区": [48.8575, 2.3600],
  "奥赛博物馆": [48.8600, 2.3266], "拉丁区": [48.8500, 2.3447],
  // 京都
  "伏见稻荷大社": [34.9671, 135.7727], "清水寺": [34.9949, 135.7850],
  "金阁寺": [35.0394, 135.7292], "岚山竹林": [35.0170, 135.6712],
  "锦市场": [35.0048, 135.7656], "祇园": [35.0036, 135.7765],
  "京都御所": [35.0254, 135.7621], "京都塔": [34.9876, 135.7592],
  // 首尔
  "景福宫": [37.5796, 126.9770], "明洞": [37.5637, 126.9847],
  "N首尔塔": [37.5512, 126.9882], "北村韩屋村": [37.5824, 126.9857],
  "广藏市场": [37.5700, 126.9990], "弘大": [37.5559, 126.9232],
  "梨泰院": [37.5345, 126.9940], "汉江公园": [37.5283, 126.9340],
  // 巴厘岛
  "海神庙": [-8.6213, 115.0868], "乌布皇宫": [-8.5069, 115.2624],
  "德格拉朗梯田": [-8.4310, 115.2796], "金巴兰海滩": [-8.7820, 115.1650],
  "圣猴森林": [-8.5183, 115.2587], "水明漾": [-8.6914, 115.1550],
  "乌鲁瓦图断崖": [-8.8291, 115.0849], "巴厘岛鸟园": [-8.5930, 115.2510],
  // 纽约
  "自由女神像": [40.6892, -74.0445], "时代广场": [40.7580, -73.9855],
  "中央公园": [40.7829, -73.9654], "大都会艺术博物馆": [40.7794, -73.9632],
  "第五大道": [40.7638, -73.9731], "布鲁克林大桥": [40.7061, -73.9969],
  "切尔西市场": [40.7425, -74.0061], "高线公园": [40.7480, -74.0048],
  // 伦敦
  "大本钟": [51.5007, -0.1246], "大英博物馆": [51.5194, -0.1270],
  "伦敦塔桥": [51.5055, -0.0754], "牛津街": [51.5152, -0.1419],
  "博罗市场": [51.5055, -0.0910], "海德公园": [51.5073, -0.1657],
  "伦敦眼": [51.5033, -0.1195], "诺丁山": [51.5124, -0.2045],
}

const CITY_CENTERS: Record<string, [number, number]> = {
  "东京": [35.6762, 139.6503], "大阪": [34.6937, 135.5023],
  "曼谷": [13.7563, 100.5018], "巴黎": [48.8566, 2.3522],
  "京都": [35.0116, 135.7681], "首尔": [37.5665, 126.9780],
  "巴厘岛": [-8.3405, 115.0920], "纽约": [40.7128, -74.0060],
  "伦敦": [51.5074, -0.1278],
}

interface TripMapProps {
  itinerary: DayPlan[]
  destination: string
}

function FitBounds({ itinerary, destination }: { itinerary: DayPlan[]; destination: string }) {
  const map = useMap()

  useEffect(() => {
    const coords: [number, number][] = []
    itinerary.forEach((day) => {
      day.nodes.forEach((node) => {
        const coord = ATTRACTION_COORDS[node.title]
        if (coord) coords.push(coord)
      })
    })

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])))
      map.fitBounds(bounds, { padding: [40, 40] })
    } else {
      const center = CITY_CENTERS[destination] || [35.6762, 139.6503]
      map.setView(center, 12)
    }
  }, [itinerary, destination, map])

  return null
}

function MapErrorHandler({ onError }: { onError: () => void }) {
  const map = useMap()

  useEffect(() => {
    const handleTileError = () => {
      onError()
    }
    map.on('tileerror', handleTileError)
    return () => {
      map.off('tileerror', handleTileError)
    }
  }, [map, onError])

  return null
}

export default function TripMap({ itinerary, destination }: TripMapProps) {
  const center = CITY_CENTERS[destination] || [35.6762, 139.6503]
  const [mapError, setMapError] = useState(false)

  const markers: { name: string; coord: [number, number]; day: number; category: string }[] = []
  itinerary.forEach((day) => {
    day.nodes.forEach((node) => {
      const coord = ATTRACTION_COORDS[node.title]
      if (coord) {
        markers.push({ name: node.title, coord, day: day.day, category: node.category })
      }
    })
  })

  const polylines: [number, number][][] = []
  itinerary.forEach((day) => {
    const dayCoords: [number, number][] = []
    day.nodes.forEach((node) => {
      const coord = ATTRACTION_COORDS[node.title]
      if (coord) dayCoords.push(coord)
    })
    if (dayCoords.length > 1) polylines.push(dayCoords)
  })

  const dayColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-200">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
        🗺️ 行程地图
      </div>
      <div style={{ height: '320px', width: '100%' }}>
        {mapError ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2">
            <span className="text-3xl">🗺️</span>
            <p className="text-sm">地图加载失败，请检查网络连接</p>
            <button
              onClick={() => setMapError(false)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              点击重试
            </button>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; 高德地图'
              url="https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7"
              subdomains={['1', '2', '3', '4']}
            />
            <MapErrorHandler onError={() => setMapError(true)} />
            <FitBounds itinerary={itinerary} destination={destination} />

            {markers.map((m, i) => (
              <Marker key={i} position={m.coord}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">Day {m.day} · {m.category}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {polylines.map((line, i) => (
              <Polyline
                key={i}
                positions={line}
                color={dayColors[i % dayColors.length]}
                weight={3}
                opacity={0.7}
                dashArray="8 4"
              />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}