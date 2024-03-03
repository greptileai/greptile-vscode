import React, { useContext, useEffect, useState } from 'react'
import { useChat } from 'ai/react'

import { useChatState } from '../../providers/chat-state-provider'
import { SessionContext } from '../../providers/session-provider'
import { cleanMessage } from '../../lib/greptile-utils'
import { vscode } from '../../lib/vscode-utils'
import { Message, RepositoryInfo } from '../../types/chat'
import { Session } from '../../types/session'
import { API_BASE } from '../../data/constants'
import { ChatList } from './chat-list'
import { ChatPanel } from './chat-panel'

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

  let repos = Object.values(session?.state?.repoStates).map((repoState: RepositoryInfo) => ({
    name: repoState.repository,
    branch: repoState.branch,
  }))

  // vercel's ai useChat
  const { messages, input, isLoading, append, reload, stop, setInput, setMessages } = useChat({
    api: `${API_BASE}/query`,
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
      } as Session)
      setIsStreaming(true)
      if (response.status === 401 || response.status === 500) {
        console.log(`${response.status} Chat Error`)
        vscode.postMessage({
          command: 'error',
          text: 'Chat Error - Please reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
        })
      } else if (response.status === 404) {
        // && session?.user?.refreshToken) {
        console.log('Error: Needs refresh or unauthorized')
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
      } as Session)
      setIsStreaming(false)
    },
  })

  useEffect(() => {
    const newDisplayMessages = messages.map((message) => cleanMessage(message))
    setDisplayMessages(newDisplayMessages)
    if (messages.length === 0) return
    if (!session?.user && messages.length > 2) {
      // console.log('Max messages reached')
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

  const someValidRepos = Object.values(session?.state?.repoStates).some(
    (repoState: RepositoryInfo) => {
      // console.log('repo state: ', repoState)
      return (repoState.status !== 'completed' && repoState.sha) || repoState.status === 'completed'
    }
  )

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
            Object.keys(session?.state?.repoStates).length > 0 &&
            !isLoading && <div>{/* Sample Questions */}</div>}
        </div>
      ) : (
        <div>
          <div>
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
