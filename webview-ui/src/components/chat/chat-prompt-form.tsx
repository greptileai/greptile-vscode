import { ReactElement, useRef, useEffect } from 'react'
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'

import { useChatState } from '../../providers/chat-state-provider'
import { useChatLoadingState } from '../../providers/chat-state-loading-provider'
import { useEnterSubmit } from '../../lib/hooks/use-enter-submit'

export interface PromptProps {
  input: string
  setInput: (input: string) => void
  onSubmit: (value: string) => Promise<void>
  isLoading: boolean
  isStreaming: boolean
  renderButton: () => ReactElement<{}>
  someValidRepos: boolean
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
  isStreaming,
  renderButton,
  someValidRepos,
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const textAreaRef = useRef(null)

  const { chatState } = useChatState()

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [])
  return (
    <form
      // onKeyDown={handleKeyDown}
      onSubmit={async (e) => {
        // if (submitDisabled) return;
        e.preventDefault()
        setInput('')
        if (!input?.trim()) {
          return
        }
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <div>
        <VSCodeTextArea
          autofocus
          ref={textAreaRef}
          defaultValue={null}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={3}
          cols={60}
          value={input}
          disabled={isLoading || chatState.disabled.value || !someValidRepos}
          resize={'both'}
          onInput={(e) => setInput(e.target.value)}
          placeholder={
            someValidRepos ? 'Ask a question' : 'Please wait while we process your repositories'
          }
          spellCheck={false}
          className='text-area'
        />
        <div>
          <VSCodeButton
            appearance='primary'
            type='submit'
            aria-label='Submit'
            disabled={isLoading || input === ''} // isStreaming?
            className='button'
          >
            Send message
          </VSCodeButton>
          {renderButton()}
        </div>
      </div>
    </form>
  )
}
