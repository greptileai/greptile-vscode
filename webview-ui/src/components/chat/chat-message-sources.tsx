import * as React from "react";
import { Globe, Minus, Plus } from "lucide-react";
import { decode } from "js-base64";

import { ChatLoadingSkeleton } from "./chat-loading-skeleton";
import { getRepoUrlForAction } from "../../lib/onboard-utils";
import { Source, RepositoryInfo } from "../../types/chat";

interface IChatMessageSources {
  sources: Source[] | undefined;
  repoStates: { [repoKey: string]: RepositoryInfo };
  isLoading: boolean;
}

export const ChatMessageSources = ({
  sources,
  repoStates,
  isLoading,
}: IChatMessageSources) => {
  const [expandedSources, setExpandedSources] = React.useState<boolean>(false);
  const numberOfSourcesToDisplayWhenCollapsed = 3;
  const skeletonArray = Array.from(
    Array(numberOfSourcesToDisplayWhenCollapsed + 1).keys(),
  );

  const getURL = (
    repoKey: string,
    repoState: RepositoryInfo,
    source: Source,
  ) => {
    if (repoState?.external)
      return `https://${repoKey}${source?.metadata?.filepath}`;
    return getRepoUrlForAction(
      {
        repository: repoState?.repository,
        branch: repoState?.branch,
        remote: repoState?.remote,
      },
      "source",
      { filepath: source?.metadata?.filepath, lines: source?.lines },
    );
  };
  const sourcesCount = sources?.length || 0;
  if (!sources || sourcesCount === 0) return <div></div>;

  return (
    <div>
      <p>{sourcesCount} result(s)</p>
      {(expandedSources
        ? sources
        : sources.slice(0, numberOfSourcesToDisplayWhenCollapsed)
      ).map((source: Source, index: number) => {
        const remote = source?.metadata?.remote || "github";
        const branch = source?.metadata?.branch || "main";
        const regex = /([a-zA-Z0-9\.-_])\/([a-zA-Z0-9\.-_])/;
        const match = source?.metadata?.repository?.match(regex);
        let repo = source?.metadata?.repository;
        if (!match) repo = decode(source?.metadata?.repository);
        const repoKey = `${remote}:${branch}:${repo}`;

        const getIcon = (remote: string) => {
          switch (remote) {
            case "github":
            case "gitlab":
            default:
              return <Globe />;
          }
        };

        return (
          <a
            key={index}
            href={getURL(repoKey, repoStates[repoKey], source)}
            target="_blank"
          >
            <div>
              <div>
                {getIcon(remote)}
              </div>
              <span>
                /{source?.metadata?.filepath}
              </span>{" "}
              {source.lines ? `[${source.lines[0]}:${source.lines[1]}]` : ""}
            </div>

            <div>
              <div>
                {repo}
              </div>
              <div>
                {branch}
              </div>
            </div>
          </a>
        );
      })}

      {(expandedSources ||
        (!expandedSources &&
          sources.length > numberOfSourcesToDisplayWhenCollapsed)) && (
        <div
          onClick={() => setExpandedSources(!expandedSources)}
        >
          <div>
            {expandedSources ? (
              <Minus />
            ) : (
              <Plus />
            )}
          </div>
          <div>
            {expandedSources
              ? `Collapse`
              : `View ${
                  sources.length - numberOfSourcesToDisplayWhenCollapsed
                } More...`}
          </div>
        </div>
      )}

      {skeletonArray.map((i) => {
        if (isLoading && sources.length < i + 1) {
          return <ChatLoadingSkeleton /> // <Skeleton key={i} className="w-full h-8" />;
        }
      })}
    </div>
  );
};
