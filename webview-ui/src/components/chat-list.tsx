import { VSCodeDivider } from "@vscode/webview-ui-toolkit/react";

import { ChatMessage } from "./chat-message";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";
import { useChatState } from "../providers/chat-state-provider";
import { Message, RepositoryInfo } from "../types/chat";

export interface ChatListProps {
  messages: Message[];
  userId: string;
  repoStates: { [repo: string]: RepositoryInfo };
  continueLastMessage?: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  readonly?: boolean;
}

export function ChatList({
  messages,
  userId,
  repoStates,
  continueLastMessage,
  isLoading,
  isStreaming,
  readonly = false,
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
              userId={userId}
              message={message}
              repoStates={repoStates}
              displayContinueButton={
                index === messages.length - 1 &&
                index !== 0 &&
                !(isLoading || isStreaming) &&
                message.role === "assistant" &&
                false
              }
              continueMessage={continueLastMessage}
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
