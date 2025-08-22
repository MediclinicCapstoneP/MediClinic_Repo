export interface ChatMessage {
  id: string
  userId: string
  message: string
  isBot: boolean
  timestamp: string
}

export interface FloatingChatBotProps {}

export interface FloatingChatBotEmits {
  messageSelect: [message: string]
}
