// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { useEffect, useState } from 'react'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'

import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '../ui/dialog'
import { MemoizedReactMarkdown } from './markdown'
import { CodeBlock } from '../ui/codeblock'
import { ChatMessageSources } from './chat-message-sources'
import { ChatMessageActions } from './chat-message-actions'
import { Message, RepositoryInfo } from '../../types/chat'

import '../../App.css'

export interface ChatMessageProps {
  userId: string
  message: Message
  repoStates: { [repo: string]: RepositoryInfo }
  readonly?: boolean
  displayDivider?: boolean
  firstMessage?: boolean
  deleteMessage: () => void
}

export function ChatMessage({
  userId,
  message,
  repoStates,
  readonly = false,
  displayDivider = false,
  firstMessage = false,
  deleteMessage,
  ...props
}: ChatMessageProps) {
  const [sourcesLoading, setSourcesLoading] = useState(true)

  useEffect(() => {
    if (message?.agentStatus?.includes('response') || message.content) {
      setSourcesLoading(false)
    }
  }, [message?.agentStatus])

  return (
    <div {...props} className='message-container'>
      <div className='message-header'>
        {message.role === 'assistant' && (
          <div className='role'>
            <div className='role-icon greptile-icon'></div>
            <div className='role-title'>Greptile</div>
          </div>
        )}
        {message.role === 'assistant' && !firstMessage && (
          <div>
            <ChatMessageActions
              message={message}
              userId={userId}
              readonly={readonly}
              deleteMessage={deleteMessage}
            />
          </div>
        )}
      </div>
      <div className='message-body'>
        <div className='message-content'>
          {message.agentStatus && <div className='agent-status'>{message.agentStatus}</div>}
          <div>
            <ChatMessageSources
              sources={message.sources || []}
              repoStates={repoStates}
              isLoading={sourcesLoading}
            />
            {message.content ? (
              <MemoizedReactMarkdown
                components={{
                  p({ children }) {
                    return <p>{children}</p>
                  },
                  h1({ children }) {
                    return <p>{children}</p>
                  },
                  h2({ children }) {
                    return <p>{children}</p>
                  },
                  h3({ children }) {
                    return <p>{children}</p>
                  },
                  code({ node, inline, className, children, ...props }) {
                    if (children.length) {
                      if (children[0] == '▍') {
                        return <span>▍</span>
                      }

                      children[0] = (children[0] as string).replace('`▍`', '▍')
                    }

                    const match = /language-(\w+)/.exec(className || '')

                    if (inline) {
                      return <code {...props}>{children}</code>
                    }
                    return (
                      <CodeBlock
                        key={Math.random()}
                        language={(match && match[1]) || ''}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    )
                  },
                  ol({ children }: any) {
                    return <ol>{children}</ol>
                  },
                  ul({ children }: any) {
                    return <ul>{children}</ul>
                  },
                  img({ src, alt }: any) {
                    return (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div>
                            <img src={src!} alt={alt!} loading='lazy' />
                            <div>
                              <svg
                                fill='#ffffff'
                                height='20px'
                                width='20px'
                                version='1.1'
                                id='Layer_1'
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 299.998 299.998'
                              >
                                <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
                                <g
                                  id='SVGRepo_tracerCarrier'
                                  stroke-linecap='round'
                                  stroke-linejoin='round'
                                ></g>
                                <g id='SVGRepo_iconCarrier'>
                                  {' '}
                                  <g>
                                    {' '}
                                    <g>
                                      {' '}
                                      <g>
                                        {' '}
                                        <path d='M139.414,96.193c-22.673,0-41.056,18.389-41.056,41.062c0,22.678,18.383,41.062,41.056,41.062 c22.678,0,41.059-18.383,41.059-41.062C180.474,114.582,162.094,96.193,139.414,96.193z M159.255,146.971h-12.06v12.06 c0,4.298-3.483,7.781-7.781,7.781c-4.298,0-7.781-3.483-7.781-7.781v-12.06h-12.06c-4.298,0-7.781-3.483-7.781-7.781 c0-4.298,3.483-7.781,7.781-7.781h12.06v-12.063c0-4.298,3.483-7.781,7.781-7.781c4.298,0,7.781,3.483,7.781,7.781v12.063h12.06 c4.298,0,7.781,3.483,7.781,7.781C167.036,143.488,163.555,146.971,159.255,146.971z'></path>{' '}
                                        <path d='M149.997,0C67.157,0,0.001,67.158,0.001,149.995s67.156,150.003,149.995,150.003s150-67.163,150-150.003 S232.836,0,149.997,0z M225.438,221.254c-2.371,2.376-5.48,3.561-8.59,3.561s-6.217-1.185-8.593-3.561l-34.145-34.147 c-9.837,6.863-21.794,10.896-34.697,10.896c-33.548,0-60.742-27.196-60.742-60.744c0-33.548,27.194-60.742,60.742-60.742 c33.548,0,60.744,27.194,60.744,60.739c0,11.855-3.408,22.909-9.28,32.256l34.56,34.562 C230.185,208.817,230.185,216.512,225.438,221.254z'></path>{' '}
                                      </g>{' '}
                                    </g>{' '}
                                  </g>{' '}
                                </g>
                              </svg>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <img src={src!} alt={alt!} loading='lazy' />
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target='_blank'>
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {message.role === 'assistant' && !message.sources && message.content[0] === '['
                  ? ''
                  : message.content.replaceAll('\u200b', '')}
              </MemoizedReactMarkdown>
            ) : (
              <div>{/* Loading Skeleton */}</div>
            )}
          </div>
        </div>
        {message.role === 'user' && (
          <div>
            <ChatMessageActions
              message={message}
              userId={userId}
              readonly={readonly}
              deleteMessage={deleteMessage}
            />
          </div>
        )}
      </div>
      {displayDivider && <VSCodeDivider role='separator' className='divider' />}
    </div>
  )
}
