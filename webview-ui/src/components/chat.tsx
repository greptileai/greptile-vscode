import React, { useContext, useEffect, useRef, useState } from 'react'
import { useChat } from "ai/react";
import { encode, decode } from "js-base64";

import { ChatList } from './chat-list';
import { ChatPanel } from './chat-panel';
import ChatProcessing from './chat-processing';
import {
    fetcher,
    getLatestCommit,
    cleanMessage,
    checkRepoAuthorization
} from "../lib/onboard-utils";
import { vscode } from "../lib/vscode-utils";
import { Message, RepositoryInfo } from '../types/chat';
import type { Session, Membership } from '../types/session.d.ts';
import { useChatLoadingState } from '../providers/chat-state-loading-provider';
import { useChatRepoState, useChatState, useUpdateChatRepoState } from '../providers/chat-state-provider';
import { SessionContext } from '../providers/session-provider';

export interface ChatProps extends React.ComponentProps<"div"> {
    session_id?: string | undefined;
    repoInfo: RepositoryInfo;
    // initialRepoStates: { [repo: string]: RepositoryInfo };
    initialMessages?: Message[];
    // chatParentId?: string;
}

export const Chat = React.memo(
    function ChatComponent({
    session_id,
    repoInfo,
    initialMessages,
    className,
  }: ChatProps)  {
    const { session, setSession } = useContext(SessionContext);

    const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const repoStates = useChatRepoState();
    const setRepoStates = useUpdateChatRepoState();
    const { chatStateDispatch } = useChatState();
    const { chatLoadingState } = useChatLoadingState();

    // vercel's ai useChat
    const {
        messages,
        append,
        reload,
        stop,
        isLoading,
        input,
        setInput,
        data,
        setMessages
    } = useChat({
        api: "https://mcxeqf7hzekaahjdqpojzf4hya0aflwj.lambda-url.us-east-1.on.aws/",
        initialMessages,
        id: session_id,
        headers: {
            "Authorization": "Bearer " + session?.user?.token
        },
        body: {
            repositories: Object.values(repoStates).map((repo) => {
                return {
                    name: repo.repository,
                    branch: repo.branch,
                    external: repo.external
                }
            }),
            sessionId: session_id,
        },
        async onResponse(response) {

            // console.log("Response: ", response);
            // console.log("Messages: ", messages);

            setIsStreaming(true);
            if (response.status === 401 || response.status === 500) {
                console.log("Error");
                vscode.postMessage({
                    command: "error",
                    text: "Error - Please reach out to us on Discord for support."
                  });
            } else if (response.status === 404) { // && session?.user?.refreshToken) {
                console.log("Error: Needs refresh and reload or unauthorized")
                // todo: refresh and reload
            }
        },
        onFinish(message) {
            setIsStreaming(false);
        }
    });

    const continueLastMessage = () => {
        append(
          {
            role: "user",
            // this is just for the user to see
            // the actual prompt is defined in /api/chat/route.ts
            content: "Please continue.",
          },
          {
            options: {
              body: {
                continueChat: true,
              },
            },
          },
        );
    };

    const getComponent = (repoInfoLoading: RepositoryInfo) => {
        if (!repoInfoLoading) {
            return (
                <p>Unexpected Error</p>
            );
        }

        switch(repoInfoLoading.status) {
            case "submitted":
                // console.log("submitted")
            case "cloning":
                // console.log("cloning")
            case "processing":
                if (!repoInfoLoading.sha) {
                    return (
                        <div>
                            <ChatProcessing repoInfo={repoInfoLoading} />
                            <p>Processing...</p>
                        </div>
                    );
                }
                // add cancellation logic here?
            case "failed":
                if (!repoInfoLoading.sha) {
                    return <p>Failed</p>;
                }
            case "completed":
                return (
                    <>
                        <div>
                            <ChatList
                                messages={displayMessages}
                                userId={session?.user?.userId || ""}
                                repoStates={repoStates}
                                continueLastMessage={continueLastMessage}
                                isLoading={isLoading}
                                isStreaming={isStreaming}
                            />
                        </div>
                        <ChatPanel
                            id={session_id}
                            isLoading={isLoading}
                            stop={stop}
                            append={append}
                            reload={reload}
                            messages={messages}
                            input={input}
                            setInput={setInput}
                            isStreaming={isStreaming}
                        />
                    </>
                );
            default:
        }
    };

    useEffect(() => {
        // console.log("messages", messages);
        const newDisplayMessages = messages.map((message) => cleanMessage(message));
        setDisplayMessages(newDisplayMessages);

        if (messages.length === 0) return;
        if(!session?.user && messages.length > 10) {
            console.log('Max messages reached')
            chatStateDispatch({
                action: "set_disabled",
                payload: {
                value: true,
                reason: "Please sign in to continue.",
                }
            })
            return;
        } else {
            chatStateDispatch({
                action: "set_disabled",
                payload: {
                value: false,
                reason: ""
                }
            })
        }
    }, [messages]);

    /** TODO: Check auth and membership */
    useEffect(() => {

         // if (!session?.user) return;

        const checkAuthandMembership = async () => {

            const response = await fetch(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/membership`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + session?.user?.token
                },
            }).then(async (res) => {
                return res.json();
            }).then(async (res) => {
                // console.log('MEMBERSHIP', res);
                return res;
            });

            if (response['membership'] !== session?.user?.membership) {
                // update session
                setSession({
                    user: {
                      token: session?.user?.token,
                      membership: response['membership']
                    }
                  } as Session);
            }

            const repoAuth = await checkRepoAuthorization(
                repoInfo.repository,
                session
            );

            switch (repoAuth) {
                case 402:
                    console.log('Error: Private repo')
                    vscode.postMessage({
                        command: "upgrade",
                        text: "Upgrade to Onboard Pro to process private repos! 🔐"})
                    break;
                case 404:
                    console.log('Error: Repo not found');
                    vscode.postMessage({
                        command: "error",
                        text: "This repository was not found, or you do not have access to it. If this is your repo, please try logging in again. Reach out to us on Discord for support."
                    });
                    break;
                case 426:
                    vscode.postMessage({
                        command: "upgrade",
                        text: "Upgrade to Onboard Pro to process large repos! 🐘"
                    });
                    break;
                default:
            }
        }

        Object.values(repoStates).forEach((repo) => {
            if (!repo.indexId) return;

            // unarchive
            fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/${encode(repo.repository, true)}/unarchive`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + session?.user?.token
              },
            });

        });

        checkAuthandMembership();
    }, []);

    return (
        getComponent(chatLoadingState.loadingRepoStates[repoInfo.repository])
    )
});
