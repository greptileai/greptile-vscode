import { VSCodeDivider } from "@vscode/webview-ui-toolkit/react";

import { ChatMessage } from "./chat-message";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";
import { useChatState } from "../../providers/chat-state-provider";
import { Message } from "../../types/chat";
import { Session } from "../../types/session";

export interface ChatListProps {
  session: Session | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  readonly?: boolean;
  setMessages: (messages: Message[]) => void;
  sessionId: string;
}

export function ChatList({
  session,
  messages,
  isLoading,
  isStreaming,
  readonly = false,
  setMessages,
  sessionId
}: ChatListProps) {
  
  const { chatState } = useChatState();
  if (!messages.length) {
    return null;
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
              displayDivider={
                index < messages.length - 1
              }
            />
          </div>
        );
      })}
      {isLoading && !isStreaming && (
        <>
          <VSCodeDivider />
          <ChatLoadingSkeleton />
        </>
      )}
      {chatState.disabled.value && !isStreaming && !isLoading && (
        <p> Please Login to Continue </p>
      )}
    </div>
  );
}
