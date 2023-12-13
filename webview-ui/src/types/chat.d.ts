import { Message } from "ai";

export type Source = {
  dist: number;
  createdAt: string;
  id: string;
  metadata: {
    filepath: string;
    repository: string;
  };
  text: string;
  lines: undefined | number[];
};

export type Message = {
  sources?: Source[];
  agentStatus?: string;
} & Message;

type ChatInfo = {
  user_id: string;
  repo: string;
  additional_repos?: string[];
  session_id: string;
  timestamp: string;
  title: string;
  newChat: boolean; // for new sessions
};

export type Chat = ChatInfo & {
  chat_log: Message[];
  additional_repos?: string[];
  parent_id?: string;
};

export type RepositoryInfo = {
  repository: string;
  indexId: string;
  branch: string;
  filesProcessed?: number;
  numFiles?: number;
  message?: string;
  private: boolean;
  sample_questions?: string[];
  sha?: string;
  external?: boolean;
  status?: "completed" | "failed" | "cloning" | "processing" | "submitted";
};

type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string;
    }
>;

export type SharedChatsDatabaseEntry = {
  id: string;
  repositories: string[];
  sharedWith: string[];
  private: boolean;
  owner: string;
};
