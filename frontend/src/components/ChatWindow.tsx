import { type Message } from '../App'
import MessageBubble from './MessageBubble'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export default function ChatWindow({ messages, isLoading, messagesEndRef }: ChatWindowProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && messages[messages.length - 1]?.content === '' && (
        <div className="flex items-center gap-1 text-gray-400 pl-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}