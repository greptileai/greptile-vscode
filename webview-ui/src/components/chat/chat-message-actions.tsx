import { type Message } from 'ai'
import { usePostHog } from 'posthog-js/react'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

import { useCopyToClipboard } from '../../lib/hooks/use-copy-to-clipboard'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
  userId?: string
  readonly?: boolean
  deleteMessage: () => void
}

export function ChatMessageActions({
  message,
  userId,
  className,
  readonly = false,
  deleteMessage,
  ...props
}: ChatMessageActionsProps) {
  const posthog = usePostHog()
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div {...props}>
      <VSCodeButton appearance='icon' aria-label='Copy message' onClick={onCopy}>
        {isCopied ? (
          <div className='icon codicon codicon-check'></div>
        ) : (
          <div className='icon codicon codicon-copy'></div>
        )}
        <span className='sr-only'>Copy message</span>
      </VSCodeButton>
      {/* {message.role == 'assistant' && !readonly && (
        <>
          <VSCodeButton
            appearance='icon'
            aria-label='Thumbs up'
            onClick={() => {
              posthog.capture('Feedback', {
                user: userId!,
                feedback: 'thumbs up',
                source: 'greptile-vscode',
              })
            }}
          >
            <div className='icon codicon codicon-thumbsup'></div>
          </VSCodeButton>
          <VSCodeButton
            appearance='icon'
            aria-label='Thumbs down'
            onClick={() => {
              posthog.capture('Feedback', {
                user: userId!,
                feedback: 'thumbs down',
                source: 'greptile-vscode',
              })
            }}
          >
            <div className='icon codicon codicon-thumbsdown'></div>
          </VSCodeButton>
        </>
      )} */}
      {/* {message.role === 'user' && !readonly && (
        <>
          <VSCodeButton appearance='icon' aria-label='Delete message' onClick={deleteMessage}>
            <div className='icon codicon codicon-trash'></div>
          </VSCodeButton>
        </>
      )} */}
    </div>
  )
}
