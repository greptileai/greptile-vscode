import { type UseChatHelpers } from "ai/react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import { PromptForm } from "./chat-prompt-form";

import "../App.css";
import mixpanel from "mixpanel-browser";
import { usePostHog } from "posthog-js/react";

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | "append"
    | "isLoading"
    | "reload"
    | "messages"
    | "stop"
    | "input"
    | "setInput"
  > {
  id?: string;
  isStreaming: boolean;
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  isStreaming,
}: ChatPanelProps) {
  const posthog = usePostHog();

  

  return (
    <div>
      <div>
        <div>
          <PromptForm
            onSubmit={async (value) => {
              console.log("Chat message sent", value);
              posthog.capture("Chat message sent", {
                source: "onboard-vscode"
              });
              mixpanel.track("Chat message sent", {
                source: "onboard-vscode"
              });

              await append({
                id,
                content: value,
                role: "user",
              });
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            isStreaming={isStreaming}
            renderButton={() => isLoading ? (
              <VSCodeButton
                appearance="secondary"
                aria-label="Stop generating"
                onClick={() => {
                  posthog.capture("Response stopped", {
                    source: "onboard-vscode"
                  });
                  mixpanel.track("Response stopped", {
                    source: "onboard-vscode"
                  });
                  stop()
                }}
                className="button"
              >
                Stop generating
              </VSCodeButton>
            ) : (
              messages?.length > 1 && (
                <VSCodeButton
                  appearance="secondary"
                  aria-label="Regenerate response"
                  onClick={() => {
                    posthog.capture("Response regenerated", {
                      source: "onboard-vscode"
                    });
                    mixpanel.track("Response regenerated", {
                      source: "onboard-vscode"
                    });
                    reload()
                  }}
                  className="button"
                >
                  Regenerate response
                </VSCodeButton>
              )
            )}
          />
        </div>
      </div>
    </div>
  );
}
