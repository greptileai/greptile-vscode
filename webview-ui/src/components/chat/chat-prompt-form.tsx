import { UseChatHelpers } from "ai/react";
import { useRef, ReactElement, useEffect} from "react";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";

import { useEnterSubmit } from "../../lib/hooks/use-enter-submit";

export interface PromptProps
  extends Pick<UseChatHelpers, "input" | "setInput"> {
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  renderButton: () => ReactElement<{}>;
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
  isStreaming,
  renderButton
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const textAreaRef = useRef(null);
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!input?.trim()) {
          return;
        }
        setInput("");
        await onSubmit(input);
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
          disabled={isLoading}
          resize={"both"}
          onInput={(e) => setInput(e.target.value)}
          placeholder="Send a message"
          spellCheck={false}
          className="text-area"
        />
        <div>
          <VSCodeButton
            appearance="primary"  
            type="submit"
            aria-label="Submit"
            disabled={isLoading || input === ""} // isStreaming?
            className="button"
          >

            Send message
          </VSCodeButton>
          {renderButton()}
        </div>
      </div>
    </form>
  );
}
