import React, { useEffect } from "react";

import { RepositoryInfo } from "../types/chat";

interface IChatProcessingProps {
  repoInfo: RepositoryInfo;
}

const ChatProcessing = ({ repoInfo }: IChatProcessingProps) => {
  const [progress, setProgress] = React.useState(0);

  useEffect(() => {
    console.log("updating progress")
    setProgress(
      (100 * (repoInfo.filesProcessed || 1)) / (repoInfo.numFiles || 1),
    );
  }, [repoInfo.filesProcessed, repoInfo.numFiles]);

  // useEffect(() => {
  //   // increment by 1 every second
  //   const interval = setInterval(() => {
  //     setProgress((progress) =>
  //       progress >= 100 ? 100 : progress + 2 / (repoInfo.numFiles || 1),
  //     );
  //     console.log(progress);
  //   }, 100);
  //   return () => clearInterval(interval);
  // }, []);

  switch (repoInfo.status) {
    case "submitted":
      // console.log("submitted");
      return (
        <div>
          <p>
            Loading, your repository has been submitted...
          </p>
          <div>
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    case "cloning":
      // console.log("cloning");
      return (
        <div>
          <p>Loading, we are cloning your repository...</p>
          <p>This may take a few seconds</p>
          <div>
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    case "processing":
      // console.log("processing");
      return (
        <div>
          <p>
            Loading, we are processing your repo
            {repoInfo &&
            repoInfo.numFiles &&
            repoInfo.numFiles > 0 &&
            repoInfo.filesProcessed
              ? `, currently processed ${repoInfo?.filesProcessed?.toString()} out of ${repoInfo?.numFiles?.toString()} files`
              : "."}
          </p>
          <p>This may take a few minutes</p>
          <div>
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    default:
      // console.log("error");
      return (
        <div>
          <p>
            Something went wrong, please reach out so that we can fix it.
          </p>
          <div>
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
  }
};

export default ChatProcessing;
