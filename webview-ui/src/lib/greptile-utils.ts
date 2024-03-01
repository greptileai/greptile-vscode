import { Tiktoken } from 'js-tiktoken'
import axios from 'axios'
import { CreateChatCompletionRequestMessage } from 'openai/resources/chat'

import { Message, Source, RepoKey, Chat, OldChat } from '../types/chat'
import type { Session } from '../types/session'

export const checkRepoAuthorization = async (
  // todo: check and update
  repoKeyInput: string, // serialized repoKey
  session: Session | null
) => {
  // console.log('Checking repo auth: ', repoKeyInput)
  const repoKey = deserializeRepoKey(repoKeyInput)

  repoKey.branch = ''

  const statusCode = await getRemote(
    serializeRepoKey(repoKey),
    'api',
    session?.user?.tokens?.[repoKey.remote]?.accessToken
  )
    .then((res) => {
      // console.log("check repo auth res", res.status);
      // if (!res.ok) throw new Error("could not access repo");
      return res.data
    })
    .then((json) => {
      const visibility = json?.['visibility'] || 'public'
      // console.log('Checking auth visibility', visibility, 'membership', session?.user?.membership)
      if (visibility !== 'public' && session?.user?.membership !== 'pro') return 402
      const size = json?.['size'] ? json['size'] : json?.['statistics']?.['repository_size']
      if (size > 10000 && session?.user?.membership !== 'pro') return 426
      return 200
    })
    .catch((err) => {
      console.log(`Auth: ${err}`)
      return 404
    })

  // console.log('check repo auth returning ', statusCode)
  return statusCode
}

export const getDefaultBranch = async (repoKey: string, session: Session | null) => {
  const repoKeyObj = deserializeRepoKey(repoKey)

  const result = getRemote(repoKey, 'api', session?.user?.tokens?.[repoKeyObj.remote]?.accessToken)
    .then((res) => res.data)
    .then((json) => json.default_branch)
    .catch((err) => {
      throw new Error(err)
    })

  return result
}

export const getLatestCommit = async (repoKey: string, session: Session | null) => {
  const repoKeyObj = deserializeRepoKey(repoKey)

  // console.log('Getting latest commit')
  const result = await getRemote(
    repoKey,
    'commit',
    session?.user?.tokens?.[repoKeyObj.remote]?.accessToken
  )
    .then((res) => res.data.sha) // TODO make sure that this is the correct field for gitlab
    .catch(() => undefined)

  return result
}

/**
 * parses URL or identifier of a repo, returns the identifier BRANCH IS NOT GUARANTEED (Serialized RepoKey)
 * in format remote:branch:repository
 * @param input URL or identifier of a repo, return the identifier
 * @returns string | null (null means failed to parse) (Serialized RepoKey or null)
 */
export const parseIdentifier = (input: string): string | null => {
  if (!isDomain(input)) {
    const regex = /^(([^:]*):([^:]*):|[^:]*)([^:]*)$/
    const match = input.match(regex)
    if (!match) return null
    const keys = input.split(':')
    if (keys.length === 1)
      return serializeRepoKey({
        remote: 'github',
        repository: keys[0].toLowerCase(),
        branch: '',
      })
    if (keys.length === 3) {
      let remote = keys[0],
        branch = keys[1],
        repository = keys[2]
      if (remote === 'azure' && repository.split('/').length === 2) {
        let repository_list = repository.split('/')
        repository_list.push(repository_list[1])
        repository = repository_list.join('/')
      }
      return serializeRepoKey({
        remote: remote?.toLowerCase(),
        repository: repository?.toLowerCase(),
        branch: branch?.toLowerCase(),
      })
    }
    return null // only 2 entries may be ambiguous (1 might be as well...)
  }
  if (!input.startsWith('http')) input = 'https://' + input
  if (input.endsWith('.git')) input = input.slice(0, -4)
  try {
    const url = new URL(input)
    const remote = (() => {
      try {
        const services = ['github', 'gitlab', 'bitbucket', 'azure']
        return services.find((service) => url.hostname.includes(service)) || null
      } catch (e) {
        return null
      }
    })()
    if (!remote) return null
    let repository, branch, regex, match
    switch (remote) {
      case 'github':
        regex = /([a-zA-Z0-9\._-]+\/[a-zA-Z0-9\._-]+)[\/tree\/]*([a-zA-Z0-0\._-]+)?/
        match = url.pathname.match(regex)
        repository = match?.[1]
        branch = match?.[2]
        break
      case 'gitlab':
        regex = /([a-zA-Z0-9\._-]+\/[a-zA-Z0-9\._-]+)(?:\/\-)?(?:(?:\/tree\/)([a-zA-Z0-0\._-]+))?/
        match = url.pathname.match(regex)
        repository = match?.[1]
        branch = match?.[2]
        break
      case 'azure':
        regex = /([a-zA-Z0-9\.\/_-]+)/
        match = url.pathname.match(regex)
        repository = match?.[1].split('/').filter((x) => x !== '_git' && x !== '') || []
        repository.push(repository?.slice(-1)[0])
        repository = repository.slice(0, 3).join('/')
        branch = url.searchParams.get('version')?.slice(2) // remove 'GB' from the beginning
        break
      default:
        return url.hostname
    }
    if (!repository) return null
    return serializeRepoKey({
      remote: remote?.toLowerCase(),
      repository: repository?.toLowerCase(),
      branch: (branch || '').toLowerCase(),
    })
  } catch (e) {
    return null
  }
}

// bad helper for now, hopefully will lead to cleaner solution when we abstract away identifer
export function isDomain(input: string): boolean {
  try {
    new URL(input)
    const regex = /^(([^:]*):([^:]*):|[^:]*)([^:]*)$/
    const match = input.match(regex)
    if (match) return false
    return true
  } catch (e) {
    return false
  }
}

export async function fetcher<JSON = any>(input: RequestInfo, init?: RequestInit): Promise<JSON> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function countTokensInMessages(
  messages: CreateChatCompletionRequestMessage[],
  encoder: Tiktoken
) {
  // export function countTokensInMessages(messages: ChatCompletionRequestMessage[]) {
  // just return the number of characters for now
  // Temporary soln until we can get the encoder working
  // return JSON.stringify(messages).length / 3;

  let counter = 0
  messages.forEach((message) => {
    counter += 4
    for (const key of Object.keys(message)) {
      if (key === 'name') counter -= 1
    }
    for (const value of Object.values(message)) {
      counter += encoder.encode(String(value)).length
    }
  })
  counter += 2
  return counter
}

// export function cleanTextForGPT(text: string): string {
//   // return text.replaceAll("<|endoftext|>", "< | end of text | >");
//   return text.replaceAll(
//     "<|endoftext|>",
//     "<\u200B|\u200Bend\u200Bof\u200Btext\u200B|\u200B>",
//   );
// }

export function cleanMessage(message: Message): Message {
  const contentChunks: string[] = []
  const sources: Source[] = []
  let agentStatus = ''

  const segments = message.content.split('\n')
  for (const segment of segments) {
    let type = ''
    let message: any = ''
    try {
      const parsedSegment = JSON.parse(segment)
      type = parsedSegment.type
      message = parsedSegment.message
    } catch (e) {
      // Long ignore strings are sometimes not able to be parsed
      if (segment.startsWith('{"type":"ignore"')) {
        continue
      }

      // can't parse as JSON, so it's probably a string
      contentChunks.push(segment + '\n')
      continue
    }

    // At this point, we have a JSON message
    if (type === 'status') {
      agentStatus = message
    } else if (type === 'sources') {
      sources.push(message)
    } else if (type === 'message') {
      contentChunks.push(message)
    }
  }

  return {
    ...message,
    content: contentChunks.join(''),
    agentStatus: agentStatus.length > 0 ? agentStatus : undefined,
    sources: sources.length > 0 ? sources.flat() : message?.sources,
  }
}

export const getNewSessionId = () => {
  const session_id =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return session_id
}

export function deserializeRepoKey(repoKey: string): RepoKey {
  if (!repoKey) return
  let [remote, repository, branch] = repoKey.split(':')
  if (remote !== 'github' && remote !== 'gitlab' && remote !== 'azure') {
    remote = 'github'
  }
  if (!branch && !repository) {
    // old method
    repository = remote
    remote = 'github'
    branch = '' //  get default branch outside of helper function (don't want to make async)
  }
  return { remote, branch, repository }
}

export function serializeRepoKey(repoKey: RepoKey): string {
  const { remote, repository, branch } = repoKey
  return `${remote}:${repository}:${branch}`
}

export function getRepoKeysFromParams(params: {
  [key: string]: string | string[] | undefined
}): string[] {
  let paramRepos: string[] = []
  if (Array.isArray(params.repo)) {
    paramRepos = params.repo.map((x) => parseIdentifier(decodeURIComponent(x.trim())) || '')
  } else if (typeof params.repo === 'string') {
    const repoKey = parseIdentifier(decodeURIComponent(params.repo)) || ''
    paramRepos = [repoKey]
  }
  return paramRepos
}

interface CloneProps {
  repo: string
  token?: string
}

interface SourceProps {
  repo: string
  branch: string
  filepath: string
  lines?: string[]
}

interface ApiProps {
  repo: string
  branch?: string
}

/**
 * Return a url for an action for a repo
 * @param repoKey repo identifier
 * @param action action to be done
 * @returns
 */
export function getRepoUrlForAction(
  repoKey: RepoKey,
  action: string,
  args?: any | undefined
): string | undefined {
  const remote = repoKey.remote
  const branch = repoKey.branch
  const repository = repoKey.repository

  const remote_source_url: { [key: string]: any } = {
    github: {
      clone: ({ repo, token }: CloneProps) => `https://github.com/${repo}.git`,
      api: ({ repo, branch }: ApiProps) =>
        `https://api.github.com/repos/${repo}` + (branch ? `/branches/${branch}` : ''),
      source: ({ repo, branch, filepath, lines }: SourceProps) =>
        `https://github.com/${repo}/blob/${branch}/${filepath}${
          lines ? `#L${lines[0]}-L${lines[1]}` : ''
        }`,
      commit: ({ repo, branch }: ApiProps) =>
        `https://api.github.com/repos/${repo}/commits/${branch}`,
    },
    gitlab: {
      clone: ({ repo, token }: CloneProps) => `https://gitlab.com/${repo}.git`,
      api: ({ repo, branch }: ApiProps) =>
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(repo)}` +
        (branch ? `/repository/branches/${encodeURIComponent(branch)}` : '') +
        '?statistics=true',
      source: ({ repo, branch, filepath, lines }: SourceProps) =>
        `https://gitlab.com/${repo}/-/blob/${branch}/${filepath}${
          lines ? `#L${lines[0]}-L${lines[1]}` : ''
        }`,
      commit: ({ repo, branch }: ApiProps) =>
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(repo)}/repository/commits/${
          branch ? encodeURIComponent(branch) : ''
        }`,
    },
    azure: {
      clone: ({ repo, token }: CloneProps) =>
        `https://dev.azure.com/${repo.split('/').slice(0, 2).join('/')}/_git/${
          repo.split('/').slice(-1)[0]
        }`,
      api: ({ repo, branch }: ApiProps) =>
        `https://dev.azure.com/${repo.split('/').slice(0, 2).join('/')}/_apis/git/repositories/${
          repo.split('/').slice(-1)[0]
        }/refs/heads/${branch ? branch : ''}`,
      source: ({ repo, branch, filepath, lines }: SourceProps) =>
        `https://dev.azure.com/${repo.split('/').slice(0, 2).join('/')}/_git/${
          repo.split('/').slice(-1)[0]
        }/blob/${branch}/${filepath}${lines ? `#L${lines[0]}-L${lines[1]}` : ''}`,
      commit: ({ repo, branch }: ApiProps) =>
        `https://dev.azure.com/${repo.split('/').slice(0, 2).join('/')}/_apis/git/repositories/${
          repo.split('/').slice(-1)[0]
        }/commits/${branch}`,
    },
  }

  if (!remote_source_url[remote] || !remote_source_url[remote][action]) return undefined

  return remote_source_url[remote][action]({
    repo: repository,
    branch,
    ...args,
  })
}

export function convertOldChatInfo(chat: OldChat): Chat {
  const {
    user_id,
    repos: dynamoRepos,
    session_id,
    chat_log,
    timestamp,
    title,
    additional_repos,
    repo,
  } = chat
  const repos = (dynamoRepos || []).concat(additional_repos || []).concat(repo ? [repo] : [])
  const newChat: Chat = {
    user_id,
    repos,
    session_id,
    chat_log,
    timestamp,
    title,
    newChat: true,
  }
  return newChat
}

async function getRemote(repoKey: string, action: string, token: string) {
  const dRepoKey = deserializeRepoKey(repoKey)
  if (dRepoKey.remote === 'github' && dRepoKey.repository === 'github')
    return { data: '', status: 499 }

  const url = getRepoUrlForAction(dRepoKey, action)
  if (!url) return { data: '', error: 'No url found for action', status: 500 }

  try {
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    const externalResponse = await axios.get(url, { headers })
    const data = await externalResponse.data
    // console.log('data retrieved')
    return { data: data, status: 200 }
  } catch (error) {
    console.log('Error fetching external api')
    return { data: '', error: 'Error fetching external API', status: 500 }
  }
}

export async function parseRepoInput(session: Session) {
  const repoUrl = session?.state?.repoUrl

  let parsedRepo = undefined
  if (repoUrl) {
    const identifier = parseIdentifier(repoUrl)
    if (!identifier) {
      return null
    }

    let branch = ''
    if (session?.state?.branch) {
      branch = session.state.branch
    } else {
      branch = await getDefaultBranch(identifier, session)
    }

    parsedRepo = identifier + `${branch}`
  }

  return parsedRepo
}
