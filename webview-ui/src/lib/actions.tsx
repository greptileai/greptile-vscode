import { fetcher } from "./onboard-utils";
import { Chat, RepositoryInfo } from "../types/chat";
import type { Session } from "../types/session";

// note: for now, the vscode extension doesn't support getting recent chats, so getChat will never be called
export async function getChat(
    session_id: string,
    user_id: string,
    session: Session
  ): Promise<Chat | null> {
    // check authorization here
    // console.log("getting chat", session_id, user_id);

    try {
      const chat: any = await fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/chats/${session_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + session?.user?.token
        },
      })
      // console.log(chat);

      if (!chat || (user_id && chat.user_id !== user_id)) {
        throw new Error("Chat did not return anything or user_id does not match");
      }

      return chat;
    } catch (error) {
      console.log("Error getting chat", error);
      return null;
    }
}

export async function getNewChat(
    userId: string,
    repo: string,
  ): Promise<Chat | null> {
    // need to wait until chat history has been fetched and set
    console.log("Getting new chat");

    const session_id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    // will need to poll
    return {
      user_id: userId,
      repo,
      session_id,
      chat_log: [],
      timestamp: Math.floor(Date.now() / 1000).toString(),
      title: repo,
      newChat: true,
    };
}

export async function getRepo(
  repo: string,
  session: Session
): Promise<RepositoryInfo | null> {
  try {
    // query parameter = comma separated list of repos
    const repoInfo: any = await fetcher(`https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1/repositories/batch?repositories=${repo}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session?.user?.token // todo: fix for when no token exists?
      },
    })

    // console.log(repoInfo);
    return repoInfo;
  } catch (error) {
    console.log(error);
    return null;
  }
}