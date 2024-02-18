import React, { createContext, useContext, useReducer } from 'react'

import { type RepositoryInfo, ChatInfo } from '../types/chat'

export type ChatState = {
  session_id: string
  repoStates: { [repo: string]: RepositoryInfo }
  disabled: { value: boolean; reason: string }
  chats: ChatInfo[]
}

const initialChatState = {
  disabled: { value: false, reason: '' },
  repoStates: {},
  session_id: '',
  chats: [],
}

export interface ChatStateAction {
  action: string
  payload: any
}

const chatStateReducer = (state: any, action: ChatStateAction) => {
  switch (action.action) {
    case 'set_chats':
      return {
        ...state,
        chats: action.payload,
      }
    case 'set_session_id':
      return {
        ...state,
        session_id: action.payload,
      }
    case 'set_disabled':
      return {
        ...state,
        disabled: action.payload,
      }
    case 'set_repo_states':
      return {
        ...state,
        repoStates: action.payload,
      }
    case 'set_streaming':
      return {
        ...state,
        streaming: action.payload,
      }
    default:
      return state
  }
}

const ChatStateContext = createContext<{
  chatState: ChatState
  chatStateDispatch: React.Dispatch<ChatStateAction>
}>({
  chatState: initialChatState,
  chatStateDispatch: (action: ChatStateAction) => {},
})

export const useChatState = () => {
  const context = useContext(ChatStateContext)
  if (context === undefined) {
    throw new Error('useChatState must be used within a ChatStateProvider')
  }
  return context
}

interface ChatStateProviderProps {
  sessionId: string
  repoStates: { [repo: string]: RepositoryInfo }
}

export function ChatStateProvider({
  children,
  initialProvidedState,
}: {
  children: React.ReactNode
  initialProvidedState: ChatStateProviderProps
}) {
  const [chatState, chatStateDispatch] = useReducer(chatStateReducer, {
    ...initialChatState,
    ...initialProvidedState,
  })

  return (
    <ChatStateContext.Provider value={{ chatState, chatStateDispatch }}>
      {children}
    </ChatStateContext.Provider>
  )
}
