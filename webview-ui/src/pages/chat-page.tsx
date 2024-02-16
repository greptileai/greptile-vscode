import { useEffect, useContext, useState } from 'react';
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";

import { Chat as ChatComponent } from "../components/chat/chat";
import { getChat, getNewChat, getRepo } from "../lib/actions";
import { SAMPLE_REPOS } from '../data/constants';
import {
  checkRepoAuthorization,
  deserializeRepoKey,
  getDefaultBranch,
  parseIdentifier,
  serializeRepoKey
} from "../lib/onboard-utils";
import { vscode } from "../lib/vscode-utils";
import { ChatStateProvider } from '../providers/chat-state-provider';
import { SessionContext } from '../providers/session-provider';
import { Chat, RepositoryInfo, Message } from "../types/chat";
import { Session } from '../types/session';

import "../App.css"

export interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {

  const { session, setSession } = useContext(SessionContext);

  const session_id = session?.state?.chat?.session_id;
  const user_id = session?.user?.userId;
  const repo = session?.state?.repo;
  if (!repo) return <div>No repo chosen</div>;

  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [repos, setRepos] = useState<string[]>([]);
  const [repoStates, setRepoStates] = useState<{ [repoKey: string]: RepositoryInfo }>({});

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

        // check with GitHub if user has access to repo
        // const status = await checkRepoAuthorization(repo, session);
        // if (status !== 200) return;

         // **************** get chat info *******************

         let chat: Chat | null = session_id
          ? await getChat(session_id, user_id, session)
          : await getNewChat(user_id, repo);

          // console.log("chat: ", chat);

          if (!chat && !session_id) {
            // console.log("no chat and no session_id");
            chat = await getNewChat(user_id, repo);
          }
  
          setSession({
            ...session,
            state: {
              ...session?.state,
              chat: chat
            }
          })

        // **************** get repo info *******************

        const repoKeys = session?.state?.repo; // todo: update to support multiple repos

        if (!chat && !repoKeys.length) console.log("not found");

        // const repos: string[] = (
        //   chat?.repos.map((repo) => parseIdentifier(repo) || "") || []
        // ).concat(repoKeys || []);
        const repos: string[] = [parseIdentifier(repo)];

        if (repos.length === 0) console.log("not found");
        // console.log("repos: ", repos);
        setRepos(repos);

        // get empty branches and set them in new db
        const getRepoInfoAndPermission = repos.map(async (repoKey: string) => {
          const dRepoKey = deserializeRepoKey(repoKey);
          let defaultBranch = "";
          if (!dRepoKey.remote) dRepoKey.remote = "github";
          if (!dRepoKey.branch)
            defaultBranch = await getDefaultBranch(repoKey, session);
            dRepoKey.branch = defaultBranch;
          // console.log("default branch: ", defaultBranch);

          // replace significant-gravitas/auto-gpt with significant-gravitas/autogpt
          // hacky solution, works for now. Ideally get the canonical name from the remote
          if (dRepoKey.repository.toLowerCase() === "significant-gravitas/auto-gpt") {
            dRepoKey.repository = "significant-gravitas/autogpt";
          }

          const completeRepoKey = serializeRepoKey(dRepoKey);
          const status = SAMPLE_REPOS.map((repo) => repo.repo).includes(
            dRepoKey.repository,
          )
            ? 200
            : await checkRepoAuthorization(completeRepoKey, session);
          // console.log("status: ", status);
          if (status !== 200 && status !== 426)
            throw new Error("Unauthorized or Does not exist");
          console.log("verified permission");

          let temp = dRepoKey.remote + ":" + dRepoKey.repository.toLowerCase() + ":" + dRepoKey.branch;

          let repoInfo = await getRepo(temp, session) // returns [failed, responses]
          .catch((e) => {
            console.error(e);
          });
          // console.log("repoInfo: ", repoInfo);
          if (!repoInfo) {
            console.log("no repo info");
            return;
          }
          return [temp, repoInfo] as [ // changed, might need to revert
            string,
            any // RepositoryInfo,
          ];
        });

        const repoInfoAndPermission = await Promise.allSettled(
          getRepoInfoAndPermission
        );

        let successes = 0;
        repoInfoAndPermission.forEach((promise) => {
          if (promise.status === "fulfilled") {
            const [repoKey, repoInformation] = promise.value;
            if (!repoKey) return;

            setRepoInfo(repoInformation.responses[0]); // todo: support multiple repos and handle failed repos
            
            setRepoStates({
              // ...repoStates,
              [repoKey]: {
                  ...repoInformation.responses[0],
                  status: repoInformation.status || "submitted",
                }
            }); // todo: check this

            successes++;
          } else {
            console.error(promise.reason);
          }
        });

        if (successes === 0) console.log("not found");
    }

    fetchInfo();
  }, []);

  if (!session?.state?.repoInfo || !session?.state?.chat) {
    // console.log('session.state.repoInfo: ', session?.state?.repoInfo, 'session.state.chat: ', session?.state?.chat)
    return <VSCodeProgressRing />
  }

  const getRepositories = () => {
    if (repos.length === 1) return deserializeRepoKey(repos[0]).repository;
    const repoNames = repos
      .map((repo) => deserializeRepoKey(repo).repository)
      .join(", ");
    return (
      repoNames.slice(0, repoNames.lastIndexOf(", ")) +
      " and " +
      repoNames.slice(repoNames.lastIndexOf(", ") + 2)
    );
  };

  const firstMessage = {
    role: "assistant",
    content: `Hi! I am an expert on the ${getRepositories()} repositor${
      repos.length > 1 ? "ies" : "y"
    }.\
    Ask me anything! To share your feedback with our team,\
    click [here](https://calendly.com/dakshgupta/free-coffee).`,
  } as Message;

  const formatted_chat_log = session?.state?.chat_log || [];
  // console.log('repostates: ', repoStates);

  return (
    <>
    <ChatStateProvider
      initialProvidedState={{
          sessionId: session?.state?.chat?.session_id,
          repoStates: repoStates,
        }}
      >
        <ChatComponent
          initialMessages={[firstMessage].concat(formatted_chat_log)}
          sessionId={session?.state?.chat?.session_id}
          repoStates={repoStates}
        />
    </ChatStateProvider>
    </>
  );
}
