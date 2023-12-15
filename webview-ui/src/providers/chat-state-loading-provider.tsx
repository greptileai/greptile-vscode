import React, {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useState
} from "react";
import { encode, decode } from "js-base64";

import { useChatState } from "./chat-state-provider";
import { SessionContext } from "./session-provider";
import {
  fetcher,
  getLatestCommit,
} from "../lib/onboard-utils";
import { vscode } from "../lib/vscode-utils";
import { type RepositoryInfo } from "../types/chat";
import type { Session } from '../types/session';

export type ChatLoadingState = {
  loadingRepoStates: { [repo: string]: RepositoryInfo };
}

const initialChatState = {
  loadingRepoStates: {},
}

export interface ChatStateAction {
  action: string;
  payload: any;
}

const chatLoadingStateReducer = (state: any, action: ChatStateAction) => {
  // console.log("chatLoadingStateReducer", action)
  switch (action.action) {
    case "set_loading_repo_states":
      return {
        ...state,
        loadingRepoStates: action.payload,
      };
    default:
      return state;
  }
}

const ChatLoadingStateContext = createContext<{
  chatLoadingState: ChatLoadingState;
  chatLoadingStateDispatch: React.Dispatch<ChatStateAction>;
}>({
  chatLoadingState: initialChatState,
  chatLoadingStateDispatch: (action: ChatStateAction) => {},
});

export const useChatLoadingState = () => {
  const context = useContext(ChatLoadingStateContext);
  if (context === undefined) {
    throw new Error("useChatLoadingState must be used within a ChatLoadingStateProvider");
  }
  return context;
}

export function ChatLoadingStateProvider({ children, initialState }: { children: React.ReactNode, initialState: ChatLoadingState }) {
  const [chatLoadingState, chatLoadingStateDispatch] = useReducer(chatLoadingStateReducer, {
    ...initialChatState,
    ...initialState,
  });
  const { chatState, chatStateDispatch } = useChatState();

  const { session, setSession } = useContext(SessionContext);

  const isCancelled = useRef(false);
  useEffect(() => {
    // console.log('useEffect for polling', chatState.repoStates);
    isCancelled.current = false;
    const poll = async () => {
      // console.log('polling repo states')
      let newRepoStates = chatState.repoStates;
      const latestVersion = await getLatestCommit(
        chatState.mainRepoInfo.repository,
        chatState.mainRepoInfo.branch,
        session?.user?.token,
      );
      if (
        chatState.mainRepoInfo.sha &&
        latestVersion !== chatState.mainRepoInfo.sha &&
        chatState.mainRepoInfo.status === "completed"
      ) {
        fetch('https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories', {
          method: "POST",
          body: JSON.stringify({
            repository: chatState.mainRepoInfo.repository,
            notify: false,
          }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + session?.user?.token
          },
        });
        // sleep 2 seconds to let the clone start
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      let metalIndexStatus = await fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/${encode(chatState.mainRepoInfo.repository, true)}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " +  session?.user?.token
        },
      }).then((res) => res.status);

      // set status to processing for all, to at least check once
      Object.keys(newRepoStates).forEach((repo) => {
        newRepoStates[repo] = {
          ...newRepoStates[repo],
          status: "processing",
        };
      });

      let maxTries = 1000000000; // lol
      const repoFailureCount: { [key: string]: number } = {};
      const clonedReposWaitingForUnarchive: string[] = [];
      while (!isCancelled.current && maxTries-- > 0) {
        // console.log('polling', newRepoStates, isCancelled.current);
        let repos = Object.keys(newRepoStates).filter(
          (repo) =>
            !newRepoStates[repo].repository ||
            (newRepoStates[repo].status !== "completed" &&
              (repoFailureCount[repo] || 0) < 3 &&
              !clonedReposWaitingForUnarchive.includes(repo)),
        );
        // potential problem: initialAdditionalRepos is deleted during chat
        // but once new repos are set it still polls for the repos as well.
        if (repos.length === 0) break;

        // const response: RepositoryInfo[] = await fetcher(
        //   `http://localhost:3001/api/poll/batch?repos=${repos.join(",")}`,
        // );
        const repoInfo: any = await fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/batch?repositories=${repos.join(",")}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + session?.user?.token
          },
        })
        const response = [repoInfo.responses[0]]; // todo: catch failed repo

        for (const repoStatus of response) {
          // TODO: handle error in some
          newRepoStates[repoStatus.repository] = {
            ...newRepoStates[repoStatus.repository],
            ...repoStatus,
            numFiles: repoStatus.numFiles,
            filesProcessed: repoStatus.filesProcessed,
            status:
              repoStatus.status === "completed" && metalIndexStatus === "LIVE"
                ? "completed"
                : repoStatus.status,
          };
          // TODO: temporary solution, make this work with all repos
          if (
            repoStatus.status === "completed" &&
            !clonedReposWaitingForUnarchive.includes(repoStatus.repository)
          ) {
            clonedReposWaitingForUnarchive.push(repoStatus.repository);
          }
          if (repoStatus.status === "failed") {
            repoFailureCount[repoStatus.repository] =
              (repoFailureCount[repoStatus.repository] || 0) + 1;
          }
        }

        // console.log('polling set loading repos 1')
        chatLoadingStateDispatch({
          action: "set_loading_repo_states",
          payload: { ...chatLoadingState.loadingRepoStates, ...newRepoStates},
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      // console.log('polling set loading repos 2')
      chatLoadingStateDispatch({
        action: "set_loading_repo_states",
        payload: { ...chatLoadingState.loadingRepoStates, ...newRepoStates},
      });

      // check if metal index is live
      while (metalIndexStatus !== "LIVE") {
        // set repository status to processing
        // console.log('polling set loading repos 3')
        chatLoadingStateDispatch({
          action: "set_loading_repo_states",
          payload: { ...chatLoadingState.loadingRepoStates, ...newRepoStates},
        });

        if (metalIndexStatus === "ARCHIVED") {
          // if archived, then we need to reindex
          fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/${encode(chatState.mainRepoInfo.repository, true)}/unarchive`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + session?.user?.token
            },
          });
          if (isCancelled.current) {
            // console.log('Polling stopped');
            break; // Exit the loop if polling is cancelled
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        metalIndexStatus = await fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/${encode(chatState.mainRepoInfo.repository, true)}/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " +  session?.user?.token,
          },
        }).then((res) => res.status);
        // console.log("metalIndex", metalIndex);
        newRepoStates[chatState.mainRepoInfo.repository] = {
          ...newRepoStates[chatState.mainRepoInfo.repository],
          status: metalIndexStatus === "LIVE" ? "completed" : "processing",
        };
        // console.log("metal index status:", metalIndexStatus);
      }
      // console.log('polling set loading repos 4')
      chatLoadingStateDispatch({
        action: "set_loading_repo_states",
        payload: { ...chatLoadingState.loadingRepoStates, ...newRepoStates},
      });
      // console.log('done polling, pushing changes to context above')
      // this update will trigger the poll again, but it should exit if done
      chatStateDispatch({
        action: "set_repo_states",
        payload: newRepoStates,
      });
    };
    poll();
    return () => {
      // TODO: this is not exiting properly
      isCancelled.current = true;
    };
  }, [chatState.repoStates])

  return (
    <ChatLoadingStateContext.Provider value={{chatLoadingState, chatLoadingStateDispatch}}>
      {children}
    </ChatLoadingStateContext.Provider>
  );
}
