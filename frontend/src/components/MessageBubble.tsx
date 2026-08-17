import { type Message } from '../App'
import ReactMarkdown from 'react-markdown'
import VersionTabs from './VersionTabs'
import TripMap from './TripMap'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
        }`}
      >
        {/* 角色标识 */}
        <div className={`text-xs mb-1 font-medium ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {isUser ? '你' : '✈️ 旅行规划师'}
        </div>

        {/* 内容 */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="message-content text-sm leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.versions && message.versions.length > 0 && (
              <VersionTabs versions={message.versions} />
            )}
            {message.itinerary && message.itinerary.length > 0 && (
              <TripMap itinerary={message.itinerary} destination={message.destination || ''} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}