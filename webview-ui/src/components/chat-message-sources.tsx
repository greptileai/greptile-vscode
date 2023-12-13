import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ExternalLink } from "lucide-react";
import { decode } from "js-base64";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { MemoizedReactMarkdown } from "../components/markdown";
import { Source, RepositoryInfo } from "../types/chat";

import "../App.css"

interface IChatMessageSources {
  sources: Source[] | undefined;
  repoStates: { [repo: string]: RepositoryInfo };
}
export const ChatMessageSources = ({
  sources,
  repoStates,
}: IChatMessageSources) => {
  const getURL = (repo: string, repoState: RepositoryInfo, source: Source) => {
    if (repoState?.external)
      return `https://${repo}${source?.metadata?.filepath}`;
    return `https://github.com/${repo}/blob/${repoStates[repo]?.branch}/${source
      ?.metadata?.filepath}${
      source.lines ? `#L${source.lines[0]}-L${source.lines[1]}` : ""
    }`;
  };

  if (!sources || sources.length === 0) return <div></div>;

  return (
    <Collapsible>
      <div>
        <CollapsibleTrigger asChild>
          <VSCodeButton appearance="secondary">
            Sources
            <CaretSortIcon/>
            <span className="sr-only">Toggle</span>
          </VSCodeButton>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        {sources.slice(0, 10).map((source: Source, index: number) => {
          // I am so sorry for this, decode only when doesn't exist in repoStates :(
          const repo = repoStates[source?.metadata?.repository]
            ? source?.metadata?.repository
            : decode(source?.metadata?.repository);

          return (
            <div
              key={index}
            >
              <a
                href={getURL(repo, repoStates[repo.toLowerCase()], source)}
                target="_blank"
              >
                {`${repo}${
                  repoStates[repo]?.external === true ? "" : "/"
                }${source?.metadata?.filepath}`}{" "}
                {source.lines ? `[${source.lines[0]}:${source.lines[1]}]` : ""}
                <ExternalLink />
              </a>
              <MemoizedReactMarkdown>
                {source.text}
              </MemoizedReactMarkdown>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
};