import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

import { ChatMessage } from './chat-message'
import { ChatLoadingSkeleton } from './chat-loading-skeleton'
import { useChatState } from '../../providers/chat-state-provider'
import { Message } from '../../types/chat'
import { Session } from '../../types/session'

export interface ChatListProps {
  session: Session | null
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  readonly?: boolean
  setMessages: (messages: Message[]) => void
  sessionId: string
}

export function ChatList({
  session,
  messages,
  isLoading,
  isStreaming,
  readonly = false,
  setMessages,
  sessionId,
}: ChatListProps) {
  const { chatState } = useChatState()
  if (!messages.length) {
    return null
  }

  const deleteMessage = (index: number) => {
    // delete messages at index (query) and index + 1 (response)
    const newMessages = messages.slice(0, index).concat(messages.slice(index + 2))
    setMessages(newMessages)

    // todo: send api request to update backend
  }

  return (
    <div>
      {messages.map((message, index) => {
        return (
          <div key={index}>
            <ChatMessage
              userId={session?.user?.userId}
              message={message}
              repoStates={chatState.repoStates}
              readonly={readonly}
              displayDivider={index < messages.length - 1}
              firstMessage={index === 0}
              deleteMessage={() => {
                deleteMessage(index)
              }}
            />
          </div>
        )
      })}
      {isLoading && !isStreaming && (
        <>
          <VSCodeDivider className='divider' />
          <ChatLoadingSkeleton />
        </>
      )}
      {chatState.disabled.value && !isStreaming && !isLoading && (
        <p> Please Sign In to Continue </p>
      )}
    </div>
  )
}
