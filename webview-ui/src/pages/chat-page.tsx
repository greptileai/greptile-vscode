import { useEffect, useContext, useState } from 'react'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'

import { Chat as ChatComponent } from '../components/chat/chat'
import { getChat, getNewChat, getRepo } from '../lib/actions'
import { SAMPLE_REPOS } from '../data/constants'
import {
  checkRepoAuthorization,
  deserializeRepoKey,
  getDefaultBranch,
  serializeRepoKey,
} from '../lib/greptile-utils'
import { vscode } from '../lib/vscode-utils'
import { ChatStateProvider } from '../providers/chat-state-provider'
import { SessionContext } from '../providers/session-provider'
import { Chat, RepositoryInfo, Message } from '../types/chat'
import { Session } from '../types/session'

import '../App.css'

export interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const { session, setSession } = useContext(SessionContext)

  const session_id = session?.state?.chat?.session_id
  const user_id = session?.user?.userId // session?.state?.chat?.user_id

  if (!session?.user) {
    return <div className='chat-page'>Sign in with GitHub to get started.</div>
  }

  if (!session?.state?.repos) {
    return (
      <div className='chat-page'>
        <p>No repository submitted.</p>
        <p>Note: To sync this chat with your repositories, you may need to reload this view.</p>
      </div>
    )
  }

  const [repos, setRepos] = useState<string[]>(session?.state?.repos)
  const [repoStates, setRepoStates] = useState<{ [repoKey: string]: RepositoryInfo }>(
    session?.state?.repoStates
  )

  useEffect(() => {
    if (!repoStates) return
    // console.log('Trying to set session to', {
    //   ...session,
    //   state: {
    //     ...session?.state,
    //     repoStates: { ...repoStates },
    //   },
    // } as Session)
    setSession({
      ...session,
      state: {
        ...session?.state,
        repoStates: { ...repoStates },
      },
    } as Session)
  }, [repoStates]) // chatState.repoStates

  useEffect(() => {
    async function fetchInfo() {
      // console.log('Running fetchInfo for', session?.state?.repos, session)

      // **************** get chat info *******************

      // console.log('session id: ', session_id)
      // console.log('user id: ', user_id)

      let chat: Chat | undefined = undefined

      if (!session?.state?.chat) {
        chat = await getNewChat(user_id, session?.state?.repos)

        setSession({
          ...session,
          state: {
            ...session?.state,
            chat: chat,
          },
        } as Session)
      } else {
        chat = await getChat(
          session?.state?.chat?.session_id,
          session?.state?.chat?.user_id,
          session
        )

        if (!chat) {
          chat = await getNewChat(user_id, session?.state?.repos)
        }

        setSession({
          ...session,
          state: {
            ...session?.state,
            chat: chat,
          },
        } as Session)
      }

      // if (!chat) console.log('no chat found')

      // **************** get repo info *******************

      const repoKeys: string[] = repos // session?.state?.repos
      // setRepos(repoKeys)

      // get empty branches and set them in new db
      const getRepoInfoAndPermission = repoKeys.map(async (repoKey: string) => {
        const dRepoKey = deserializeRepoKey(repoKey)
        if (!dRepoKey.remote) dRepoKey.remote = 'github'
        if (!dRepoKey.branch) dRepoKey.branch = await getDefaultBranch(repoKey, session)

        // replace significant-gravitas/auto-gpt with significant-gravitas/autogpt
        // hacky solution, works for now. Ideally get the canonical name from the remote
        if (dRepoKey.repository.toLowerCase() === 'significant-gravitas/auto-gpt') {
          dRepoKey.repository = 'significant-gravitas/autogpt'
        }

        const completeRepoKey = serializeRepoKey(dRepoKey)
        // console.log('complete repo key: ', completeRepoKey)
        const status = SAMPLE_REPOS.map((repo) => repo.repo).includes(dRepoKey.repository)
          ? 200
          : await checkRepoAuthorization(completeRepoKey, session)
        if (status !== 200 && status !== 426) {
          vscode.postMessage({
            command: 'error',
            text: `You are unauthorized to access ${dRepoKey.repository} (${dRepoKey.branch}) or it does not exist. If you believe this is a mistake, please reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.`,
          })
          throw new Error('Unauthorized or does not exist')
        }

        // console.log('verified permission')

        let repoInfos = await getRepo(completeRepoKey, session) // returns [failed, responses]
          .catch((e) => {
            console.error(e)
          })
        if (!repoInfos) {
          // console.log('No repo info')
          return
        }
        return [completeRepoKey, repoInfos] as [
          string,
          any // RepositoryInfo
        ]
      })

      const repoInfoAndPermission = await Promise.allSettled(getRepoInfoAndPermission)

      let successes = 0
      repoInfoAndPermission.forEach((promise) => {
        // console.log('promise: ', promise)
        if (promise.status === 'fulfilled') {
          const [repoKey, repoInformation] = promise.value
          if (!repoKey) return

          // todo: better error handling
          // console.log('repoInformation: ', repoInformation)

          if (repoInformation?.responses?.length > 0) {
            setRepoStates({
              ...repoStates,
              [repoKey]: {
                ...repoInformation.responses[0],
                status: repoInformation.responses[0].status || 'submitted',
              },
            })

            successes++
          }
        } else {
          console.error(promise.reason)
        }
      })

      if (successes === 0) {
        vscode.postMessage({
          command: 'error',
          text: 'There was an error processing your repo. Please try again or reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
        })
      }
    }

    fetchInfo()
  }, [])

  if (!session?.state?.repoStates || !session?.state?.chat) {
    // console.log('session.state.repoStates: ', session?.state?.repoStates, 'session.state.chat: ', session?.state?.chat)
    return <VSCodeProgressRing />
  }

  const getRepositories = () => {
    if (repos.length === 1) return deserializeRepoKey(repos[0]).repository

    const repoNames: string = repos
      .reduce((completed, repo) => {
        const repoInfo = repoStates[repo]
        if (
          repoInfo?.status === 'completed' ||
          (repoInfo?.status === 'processing' && repoInfo?.numFiles === repoInfo?.filesProcessed)
        ) {
          completed.push(deserializeRepoKey(repo).repository)
        }
        return completed
      }, [])
      .join(', ')

    if (repoNames.length === 1) return repoNames[0]

    return (
      repoNames.slice(0, repoNames.lastIndexOf(', ')) +
      ' and ' +
      repoNames.slice(repoNames.lastIndexOf(', ') + 2)
    )
  }

  const firstMessage = {
    role: 'assistant',
    content: `Hi! I am an expert on the ${getRepositories()} repositor${
      repos.length > 1 ? 'ies' : 'y'
    }.\
    Ask me anything! To share your feedback with our team,\
    click [here](https://calendly.com/dakshgupta/free-coffee).`,
  } as Message

  const formatted_chat_log = session?.state?.chat?.chat_log || []

  return (
    <div className='chat-page'>
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
    </div>
  )
}
