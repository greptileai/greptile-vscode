import { encode } from 'js-base64'

import { deserializeRepoKey, fetcher, getDefaultBranch, isDomain } from './onboard-utils'
import { API_BASE } from '../data/constants'
import { Chat, RepositoryInfo } from '../types/chat'
import type { Session } from '../types/session'
import { ChatState, ChatStateAction } from '../providers/chat-state-provider'
import { vscode } from './vscode-utils'

export async function getChat(
  session_id: string,
  user_id: string,
  session: Session
): Promise<Chat | null> {
  // check authorization here
  // console.log('getting chat', session_id, user_id)

  try {
    const chat: any = await fetcher(`${API_BASE}/chats/${session_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
      },
    })

    // console.log('results of getChat: ', chat)

    if (!chat || (user_id && chat.user_id !== user_id)) {
      throw new Error('Chat did not return anything or user_id does not match')
    }

    return chat
  } catch (error) {
    console.log('Error getting chat', error)
    return null
  }
}

export async function getNewChat(userId: string, repos: string[]): Promise<Chat | null> {
  // need to wait until chat history has been fetched and set
  console.log('Getting new chat')

  const session_id =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  return {
    user_id: userId,
    repos: repos,
    session_id,
    chat_log: [],
    timestamp: Math.floor(Date.now() / 1000).toString(),
    title: repos[0].split(':').slice(-1)[0],
    newChat: true,
  }
}

export async function getRepo(
  repoKey: string, // remote:repository:branch
  session: Session
): Promise<RepositoryInfo | null> {
  // console.log(repoKey)
  try {
    const repoInfo: any = await fetcher(
      `${API_BASE}/repositories/batch?repositories=${encode(repoKey, true)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
        },
      }
    )
    // console.log('REPOINFO: ', repoInfo)
    return repoInfo
  } catch (error) {
    console.log(error)
    return null
  }
}

interface AddReposProps {
  session: Session | null
  chatState: ChatState
  chatStateDispatch: React.Dispatch<ChatStateAction>
  chatLoadingStateDispatch: React.Dispatch<ChatStateAction>
  repoKeys: string[]
}

export const addRepos = async ({
  session,
  chatState,
  chatStateDispatch,
  chatLoadingStateDispatch,
  repoKeys,
}: AddReposProps) => {
  const newAdditionalRepos: string[] = []

  const newPossibleRepoStates = repoKeys.reduce((acc, repo) => {
    if (chatState.repoStates[repo]) {
      acc[repo] = chatState.repoStates[repo]
    } else {
      const repoKey = deserializeRepoKey(repo)
      acc[repo] = {
        source_id: `${repoKey?.remote || ''}:${repoKey?.branch || ''}`,
        status: 'queued',
        remote: repoKey?.remote || '',
        repository: repoKey?.repository || '',
        private: false,
        indexId: '',
        branch: repoKey?.branch || '',
      }
    }
    return acc
  }, {} as { [repo: string]: RepositoryInfo })

  chatStateDispatch({
    action: 'set_repo_states',
    payload: newPossibleRepoStates,
  })

  const submitJobs = repoKeys.map(async (repoKey) => {
    const dRepoKey = deserializeRepoKey(repoKey)

    if (!dRepoKey.branch) dRepoKey.branch = await getDefaultBranch(repoKey, session)

    return await fetch(`${API_BASE}/repositories`, {
      // submit repo for processing
      method: 'POST',
      body: JSON.stringify({
        remote: dRepoKey.remote,
        repository: dRepoKey.repository.toLowerCase() || '', // todo: add branch
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
      },
    }).then(async (res) => {
      if (res.ok) {
        return res
      } else if (res.status === 404) {
        console.log('Error: Needs refresh token or unauthorized')
        vscode.postMessage({
          command: 'error',
          text: 'This repository was not found, or you do not have access to it. If this is your repo, please try logging in again. Reach out to us on Discord for support.',
        })
      } else {
        return res
      }
    })
  })

  const results = (await Promise.allSettled(submitJobs)) || []
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled' && !isDomain(repoKeys[index])) {
      console.error(`Request for repo ${repoKeys[index]} failed with reason:`, result.reason)
    } else {
      // add to list to fetch info and poll
      newAdditionalRepos.push(repoKeys[index])
    }
  })

  const response: any =
    (await fetcher(
      `${API_BASE}/repositories/batch?repositories=${newAdditionalRepos
        .map((repo) => encode(repo, true))
        .join(',')}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
        },
      }
    )) || []

  // console.log('newAdditionalRepos', newAdditionalRepos)
  // console.log('response', response)

  const responses = response.responses // todo: add error handling

  const newRepos = responses.reduce((acc, repo) => {
    acc[`${repo.remote}:${repo.repository}:${repo.branch}`] = repo
    return acc
  }, chatState.repoStates)

  // console.log('newRepos', newRepos)

  chatLoadingStateDispatch({
    action: 'set_loading_repo_states',
    payload: newRepos,
  })

  chatStateDispatch({
    action: 'set_repo_states',
    payload: newRepos,
  })
}
