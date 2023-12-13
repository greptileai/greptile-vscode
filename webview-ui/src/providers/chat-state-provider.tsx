import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
} from "react";

import { type RepositoryInfo } from "../types/chat";

export type ChatState = {
  disabled: { value: boolean, reason: string };
  mainRepoInfo: RepositoryInfo;
  repoStates: { [repo: string]: RepositoryInfo };
   // maybe also add showPoll, showContactForm, etc
}

const initialChatState = {
  disabled: { value: false, reason: ""},
  mainRepoInfo: {
    status: undefined,
    repository: "",
    private: false,
    indexId: "",
    branch: "",
  },
  repoStates: {},
}

export interface ChatStateAction {
  action: string;
  payload: any;
}

const chatStateReducer = (state: any, action: ChatStateAction) => {
  switch (action.action) {
    case "set_disabled":
      return {
        ...state,
        disabled: action.payload,
      };
    case "set_repo_states":
      return {
        ...state,
        repoStates: action.payload,
      };
    default:
      return state;
  }
}

const ChatStateContext = createContext<{
  chatState: ChatState;
  chatStateDispatch: React.Dispatch<ChatStateAction>;
}>({
  chatState: initialChatState,
  chatStateDispatch: (action: ChatStateAction) => {},
});

export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error("useChatState must be used within a ChatStateProvider");
  }
  return context;
}

export function useChatRepoState() {
  const { chatState } = useChatState();
  // console.log('useChatRepoState', chatState);
  const repoStates = useMemo(() => chatState.repoStates, [chatState.repoStates]);
  return repoStates;
}

export function useUpdateChatRepoState() {
  const { chatStateDispatch } = useChatState();

  const setRepoStates = (newState:  { [repo: string]: RepositoryInfo }) => {
    chatStateDispatch({
      action: 'set_repo_states',
      payload: newState,
    });
  };
  return setRepoStates;
}

export function ChatStateProvider({ children, initialState }: { children: React.ReactNode, initialState: ChatState }) {
  const [chatState, chatStateDispatch] = useReducer(chatStateReducer, {
    ...initialChatState,
    ...initialState,
  }); 

  return (
    <ChatStateContext.Provider value={{chatState, chatStateDispatch}}>
      {children}
    </ChatStateContext.Provider>
  );
}