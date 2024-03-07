import { useEffect, useRef } from 'react'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { usePostHog } from 'posthog-js/react'

import { PromptForm } from './chat-prompt-form'
import { useChatState } from '../../providers/chat-state-provider'
import { Message } from '../../types/chat'

import '../../App.css'

export interface ChatPanelProps {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  someValidRepos: boolean
  input: string
  sessionId: string
  setInput: (input: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  stop: () => void
  append: (message: Message) => void
  reload: () => void
}

export function ChatPanel({
  messages,
  isLoading,
  isStreaming,
  someValidRepos,
  input,
  sessionId,
  setInput,
  setIsStreaming,
  stop,
  append,
  reload,
}: ChatPanelProps) {
  const { chatState } = useChatState()
  const posthog = usePostHog()

  const messagesEndRef = useRef(null)

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Effect to scroll to bottom on mount
  useEffect(() => {
    scrollToBottom()
  }, [])

  return (
    <div>
      <PromptForm
        onSubmit={async (value) => {
          console.log('Chat message sent', value)
          posthog.capture('Chat message sent', {
            source: 'greptile-vscode',
          })
          await append({
            id: chatState.session_id,
            content: value,
            role: 'user',
          })
        }}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isStreaming={isStreaming}
        someValidRepos={someValidRepos}
        renderButton={() =>
          isLoading ? (
            <VSCodeButton
              appearance='secondary'
              aria-label='Stop generating'
              onClick={() => {
                posthog.capture('Response stopped', {
                  source: 'greptile-vscode',
                })
                stop()
              }}
              className='secondary-button'
            >
              Stop generating
            </VSCodeButton>
          ) : (
            messages?.length > 2 && (
              <VSCodeButton
                appearance='secondary'
                aria-label='Regenerate response'
                onClick={() => {
                  posthog.capture('Response regenerated', {
                    source: 'greptile-vscode',
                  })
                  reload()
                }}
                className='secondary-button'
              >
                Regenerate response
              </VSCodeButton>
            )
          )
        }
      />
      {/* <div ref={messagesEndRef} /> */}
    </div>
  )
}
