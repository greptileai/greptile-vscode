import React from "react";
import { AlertTriangle, CheckCircle2, Terminal } from "lucide-react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import { useChatLoadingState } from "../../providers/chat-state-loading-provider";
import { useChatState } from "../../providers/chat-state-provider";

interface ChatStatusProps {
  repoKey: string;
}

export const ChatStatus = ({ repoKey }: ChatStatusProps) => {
  const [progress, setProgress] = React.useState(0);
  const { chatLoadingState, chatLoadingStateDispatch } = useChatLoadingState();
  const { chatState, chatStateDispatch } = useChatState();
  const repoInfo = chatLoadingState.loadingRepoStates[repoKey] || {
    status: "submitted",
    repository: repoKey,
    branch: "",
    remote: "",
    numFiles: 1,
    filesProcessed: 0,
  };

  React.useEffect(() => {
    setProgress(
      (100 * (repoInfo?.filesProcessed || 1)) / (repoInfo?.numFiles || 1),
    );
  }, [repoInfo?.filesProcessed, repoInfo?.numFiles]);

  const steps = [
    "submitted",
    "cloning",
    "processing",
    "completed",
    "failed",
    undefined,
  ];

  React.useEffect(() => {
    // increment by 1 every second
    const interval = setInterval(() => {
      setProgress((progress) =>
        progress >= 100 ? 100 : progress + 2 / (repoInfo?.numFiles || 1),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [repoInfo?.numFiles]);
  const currentStep = repoInfo?.status ? steps.indexOf(repoInfo.status) : 0;
  return (
    <div>
      <span>
        <p>
          {repoInfo.repository} ({repoInfo.branch})
        </p>
      </span>
      <div>
        <div>
          <CircularProgressBar
            progress={repoInfo.status === "submitted" ? 50 : 0}
            size={24}
            completed={
              repoInfo.status === "cloning" || repoInfo.status === "processing"
            }
          />
        </div>
        <div>Submitted</div>
        <div>
          {currentStep <= 0
            ? "Submitting repository..."
            : "Repository submitted"}
        </div>
      </div>
      <div>
        <div>
          <CircularProgressBar
            progress={repoInfo.status === "cloning" ? 50 : 0}
            size={24}
            completed={repoInfo.status === "processing"}
          />
        </div>
        <div>Cloning</div>
        <div>
          {currentStep <= 1
            ? currentStep < 1
              ? "Clone repository for processing"
              : "Cloning repository..."
            : "Repository cloned"}
        </div>
      </div>
      <div>
        <div>
          <CircularProgressBar
            progress={
              repoInfo.status === "processing"
                ? ((repoInfo?.filesProcessed || 0) /
                    (repoInfo?.numFiles || 1)) *
                  100
                : 0
            }
            size={24}
          />
        </div>
        <div>Processing</div>
        <div>
          {currentStep <= 2
            ? currentStep < 2
              ? "Process repository"
              : "Processing repository..."
            : "Repository processed"}
        </div>
        <div>
          <strong>
            {(
              ((repoInfo?.filesProcessed || 0) / (repoInfo?.numFiles || 1)) *
              100
            ).toFixed(0)}
            %
          </strong>
        </div>
      </div>
      {repoInfo.status !== "failed" ? (
        <div>
          <div>
            <CircularProgressBar
              progress={repoInfo.status === "completed" ? 100 : 0}
              size={24}
            />
          </div>
          <div>Completed</div>
          <div></div>
        </div>
      ) : (
        <div>
          <div>
            <CircularProgressBar progress={100} size={24} />
          </div>
          <div>Failed</div>
          <div>This repo failed to process</div>
          <div>
            <VSCodeButton
              onClick={(target) => {
                console.log("retrying");
                chatLoadingStateDispatch({
                  action: "set_loading_repo_states",
                  payload: {
                    ...chatState.repoStates,
                    [repoKey]: {
                      ...chatState.repoStates[repoKey],
                      status: "submitted",
                    },
                  },
                });
                chatStateDispatch({
                  action: "set_repo_states",
                  payload: {
                    ...chatState.repoStates,
                    [repoKey]: {
                      ...chatState.repoStates[repoKey],
                      status: "submitted",
                    },
                  },
                });
                // todo: retry
              }}
            >
              Retry
            </VSCodeButton>
          </div>
        </div>
      )}
    </div>
  );
};

interface CircularProgressBarProps {
  progress: number;
  size: number;
  completed?: boolean;
}

const CircularProgressBar = ({
  progress,
  size,
  completed,
}: CircularProgressBarProps) => {
  const strokeWidth = 2;
  const radius = size / 2 - strokeWidth;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${Math.round(
    (progress / 100) * circumference,
  )} ${Math.round(circumference)}`;
  // console.log(
  //   "progress",
  //   progress,
  //   "size",
  //   size,
  //   "strokeWidth",
  //   strokeWidth,
  //   "radius",
  //   radius,
  //   "circumference",
  //   circumference,
  //   "strokeDasharray",
  //   strokeDasharray,
  // );

  if (completed) {
    return (
      <div>
        <CheckCircle2 size={size} color="green" />
      </div>
    );
  }

  return (
    <div>
      <svg width={size} height={size}>
        <circle
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={strokeDasharray}
          // style={{ transition: 'stroke-dashoffset 0.35s' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
};