
import { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { VSCodeProgressRing, VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import { Chat as ChatComponent } from "../components/chat";
import { type Chat, RepositoryInfo, Message } from "../types/chat";
import type { Session } from '../types/session';
import { getChat, getNewChat, getRepo } from "../lib/actions";
import { getDefaultBranch } from "../lib/onboard-utils";
import { vscode } from "../lib/vscode-utils";
import { ChatLoadingStateProvider } from '../providers/chat-state-loading-provider';
import { ChatStateProvider } from '../providers/chat-state-provider';
import { SessionContext } from '../providers/session-provider';

import "../App.css"

export interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {

  const { session, setSession } = useContext(SessionContext);

  // let { owner, repoName } = useParams();
  const session_id = session?.state?.chat?.session_id;
  const user_id = undefined;

  // const repo = [owner, repoName].join("/");
  const repo = session?.state?.repo;
  console.log("repo: ", repo);
  if (!repo) return <div>No repo chosen</div>;

  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!repoInfo) return;
    console.log("Trying to set session to", {
      ...session,
      state: {
        ...session?.state,
        repoInfo: {...repoInfo}
      }
    } as Session);
    setSession({
      ...session,
      state: {
        ...session?.state,
        repoInfo: {...repoInfo}
      }
    } as Session);
  }, [repoInfo]);

  // TODO concurrentize these api calls.
  // repoInfo might not exist if it is not processed yet
  // console.log("fetching repo info, repo:", repo);

  useEffect(() => {
    async function fetchInfo() {
      console.log("Running fetchInfo for", repo, session)
      try {

        // check with GitHub if user has access to repo
        // const status = await checkRepoAuthorization(repo, session);
        // if (status !== 200) return;

        const repoInfoDataAll: any  = await getRepo(repo, session);
        console.log("repo info data all", repoInfoDataAll);

        let repoInfoData: RepositoryInfo = repoInfoDataAll.responses[0] as RepositoryInfo;

        // ---------------------------------------------------------------------------
        if (!repoInfoData) repoInfoData = { repository: repo } as RepositoryInfo;

        if (!repoInfoData.branch && !repoInfoData?.external) {
            // console.log("updating branch");
            const branch = await getDefaultBranch(
              repoInfoData.repository,
              session?.user?.token!
            );
            if (!branch) throw new Error("branch could not be fetched");
            repoInfoData.branch = branch;
            // set branch in db
            const body = JSON.stringify({
              branch: repoInfoData.branch,
              repository: repo
            });
            axios({
              url: `https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories`,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + session?.user?.token
              },
              data: body,
            }).catch((e) => {
              console.error("Error updating branch in dynamo", e);
              return;
            });
        }
        // ---------------------------------------------------------------------------
        console.log("Setting session with repo info data", repoInfoData);
        setRepoInfo(repoInfoData);

      } catch (error) {
        vscode.postMessage({ command: "error", text: "Error fetching repo"});
        console.error("Error fetching repo:", error);
        // todo: handle error appropriately
      }

      try {
        // const session_id = /* get session_id from somewhere */;
        let chatData: Chat | null = session_id
          ? await getChat(session_id, user_id, session)
          : await getNewChat(user_id, repo);

        if (!chatData && !session_id) {
          // console.log("no chat and no session_id");
          chatData = await getNewChat(user_id, repo);
        }

        // console.log(chatData);

        setSession({
          ...session,
          state: {
            ...session?.state,
            chat: chatData
          }
        })
      } catch (error) {
        console.error("Error fetching chat:", error);
        // Handle error appropriately
      }
    }

    fetchInfo();
  }, []);

  if (!session?.state?.repoInfo || !session?.state?.chat) {
    return <VSCodeProgressRing />
  }

  const firstMessage = {
    role: "assistant",
    content: `Hi! I am an expert on the ${session?.state?.repoInfo?.repository} repository. Ask me anything! To share your feedback with our team, click [here](https://calendly.com/dakshgupta/free-coffee).`,
  } as Message;

  let repoStates = {} as { [repo: string]: RepositoryInfo };
  repoStates[repo.toLowerCase()] = session?.state?.repoInfo || null;

  // console.log("repo states", repoStates);

  // const backHandler = () => {
  //   setSession({
  //     ...session,
  //     state: {
  //       ...session?.state,
  //       chat: null
  //     }
  //   });
  //   navigate(`/`);
  // }

  return (
    <>
    <ChatStateProvider initialState={{repoStates: repoStates, mainRepoInfo: session?.state?.repoInfo || null, disabled:{value:false, reason:''}}}>
      <ChatLoadingStateProvider initialState={{loadingRepoStates: repoStates}}>
        {/* <VSCodeButton
            aria-label="Back"
            appearance="icon"
            onClick={() => backHandler()}
        >
            ←
        </VSCodeButton> */}
        <ChatComponent
          repoInfo={session?.state?.repoInfo || null}
          // initialRepoStates={repoStates}
          session_id={session?.state?.chat?.session_id}
          initialMessages={[firstMessage].concat(session?.state?.chat?.chat_log)}
          // chatParentId={chat?.parent_id}
        />
      </ChatLoadingStateProvider>
    </ChatStateProvider>
    </>
  );
}
