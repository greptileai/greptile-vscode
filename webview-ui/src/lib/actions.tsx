import { encode } from 'js-base64'

import { fetcher } from './greptile-utils'
import { API_BASE } from '../data/constants'
import { Chat, RepositoryInfo } from '../types/chat'
import type { Session } from '../types/session'

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
      // throw new Error('Chat did not return anything or user_id does not match')
      return null
    }

    return chat
  } catch (error) {
    console.log('Error getting chat: ', error)
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
    // console.log('repoinfo: ', repoInfo)
    return repoInfo
  } catch (error) {
    // console.log(error)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          fetcher(`${API_BASE}/repositories/batch?repositories=${encode(repoKey, true)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
            },
          })
        )
      }, 1000)
    })
  }
}
