import { Message } from 'ai'

export type Source = {
  repository: string
  remote: string
  branch: string
  filepath: string
  linestart: number | null
  lineend: number | null
  summary: string
}

export type Message = {
  sources?: Source[]
  agentStatus?: string
} & Message

export type RepoKey = {
  repository: string
  remote: string
  branch: string
}

type OldChatInfo = {
  user_id: string
  repo: string
  additional_repos: string[]
  session_id: string
  timestamp: string
  title: string
  newChat: boolean // for new sessions
  repos?: string[] // encoded repokey list
}

export type ChatInfo = {
  user_id: string
  repos: string[] // encoded repokey list
  session_id: string
  timestamp: string
  title: string
  newChat: boolean // for new sessions
}

export type OldChat = OldChatInfo & {
  chat_log: Message[]
  parent_id?: string
}

export type Chat = ChatInfo & {
  chat_log: Message[]
  parent_id?: string
}

export type RepositoryInfo = RepoKey & {
  source_id: string
  indexId: string
  filesProcessed?: number
  numFiles?: number
  message?: string
  private: boolean
  sample_questions?: string[]
  sha?: string
  external?: boolean
  status?: 'completed' | 'failed' | 'cloning' | 'processing' | 'submitted' | 'queued'
}

type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export type SharedChatsDatabaseEntry = {
  id: string
  repositories: string[]
  sharedWith: string[]
  private: boolean
  owner: string
}
