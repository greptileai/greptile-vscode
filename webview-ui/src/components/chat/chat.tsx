import React, { useContext, useEffect, useState } from 'react'
import { useChat } from 'ai/react'

import { ChatLoadingStateProvider } from '../../providers/chat-state-loading-provider'
import { useChatState } from '../../providers/chat-state-provider'
import { SessionContext } from '../../providers/session-provider'
import { cleanMessage } from '../../lib/greptile-utils'
import { vscode } from '../../lib/vscode-utils'
import { ChatStatus } from '../repo/chat-status'
import { ChatList } from './chat-list'
import { ChatPanel } from './chat-panel'
import { Message, RepositoryInfo } from '../../types/chat'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages: Message[]
  sessionId: string
  repoStates: { [repo: string]: RepositoryInfo }
}

export const Chat = function ChatComponent({ initialMessages, sessionId, repoStates }: ChatProps) {
  // console.log("Starting Chat", session_id, repoStates, initialMessages);

  const { session, setSession } = useContext(SessionContext)

  const [displayMessages, setDisplayMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const { chatState, chatStateDispatch } = useChatState()

  let repos = Object.values(chatState.repoStates).map((repoState) => ({
    name: repoState.repository,
    branch: repoState.branch,
  }))

  // vercel's ai useChat
  const { messages, input, isLoading, append, reload, stop, setInput, setMessages } = useChat({
    api: 'https://mcxeqf7hzekaahjdqpojzf4hya0aflwj.lambda-url.us-east-1.on.aws/',
    initialMessages,
    id: sessionId,
    headers: {
      Authorization: 'Bearer ' + session?.user?.tokens?.github.accessToken,
    },
    body: {
      repositories: repos,
      initialMessages,
      sessionId: sessionId,
    },
    async onResponse(response) {
      setSession({
        ...session,
        state: {
          ...session?.state,
          isStreaming: true,
        },
      })
      setIsStreaming(true)
      if (response.status === 401 || response.status === 500) {
        console.log('Error')
        vscode.postMessage({
          command: 'error',
          text: 'Error - Please reach out to us on Discord for support.',
        })
      } else if (response.status === 404) {
        // && session?.user?.refreshToken) {
        console.log('Error: Needs refresh and reload or unauthorized')
        // todo: refresh and reload
      }
    },
    onFinish(message) {
      setSession({
        ...session,
        state: {
          ...session?.state,
          isStreaming: false,
        },
      })
      setIsStreaming(false)
    },
  })

  useEffect(() => {
    const newDisplayMessages = messages.map((message) => cleanMessage(message))
    setDisplayMessages(newDisplayMessages)
    if (messages.length === 0) return
    if (!session?.user && messages.length > 2) {
      console.log('max messages reached')
      chatStateDispatch({
        action: 'set_disabled',
        payload: {
          value: true,
          reason: 'Please sign in to continue.',
        },
      })
      return
    } else {
      chatStateDispatch({
        action: 'set_disabled',
        payload: {
          value: false,
          reason: '',
        },
      })
    }
  }, [messages, session?.user])

  const someValidRepos = Object.values(chatState.repoStates).some((repoState) => {
    // console.log('repo state: ', repoState)
    return (repoState.status !== 'completed' && repoState.sha) || repoState.status === 'completed'
  })

  return (
    <div>
      {someValidRepos ? (
        <div>
          <ChatList
            session={session}
            messages={displayMessages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            setMessages={setMessages}
            sessionId={sessionId}
          />
          {displayMessages.length <= 1 &&
            Object.keys(chatState.repoStates).length > 0 &&
            !isLoading && <div>{/* Sample Questions */}</div>}
        </div>
      ) : (
        <div>
          <div>
            {/* <ChatLoadingStateProvider>
              {Object.keys(chatState.repoStates).map((repoKey) => {
                return <ChatStatus key={repoKey} repoKey={repoKey} />
              })}
            </ChatLoadingStateProvider> */}
            <p>
              We will email you at {session?.user?.userId} once your repository has finished
              processing.
            </p>
          </div>
        </div>
      )}
      <ChatPanel
        messages={messages}
        input={input}
        isLoading={isLoading}
        isStreaming={isStreaming}
        someValidRepos={someValidRepos}
        sessionId={sessionId}
        append={append}
        reload={reload}
        stop={stop}
        setInput={setInput}
        setIsStreaming={setIsStreaming}
      />
    </div>
  )
}
