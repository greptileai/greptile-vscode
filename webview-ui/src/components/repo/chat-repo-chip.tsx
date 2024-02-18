import { useChatState } from "../../providers/chat-state-provider";
import { deserializeRepoKey } from "../../lib/onboard-utils";

interface RepoChipProps {
  repoKey: string;
}

export const RepoChip = ({
  repoKey: sRepoKey
}: RepoChipProps) => {
  const { chatState } = useChatState();
  const state = chatState.repoStates[sRepoKey];

  if (!state) return;
  const repoKey = deserializeRepoKey(sRepoKey);

  const getStatusColor = (status: typeof state.status | "readonly") => {
    switch (status) {
      case "completed":
        return "text-green";
      case "submitted":
      case "processing":
      case "cloning":
        return "text-yellow";
      case "failed":
        return "text-red";
      case "queued":
      default:
        return "text-gray";
    }
  };

  const chipState = state?.status || "readonly";
  return (
    <div>
        <span className={`${getStatusColor(chipState)}`}>●</span>{" "}
        <p>{repoKey.repository}</p>
    </div>
  );
};