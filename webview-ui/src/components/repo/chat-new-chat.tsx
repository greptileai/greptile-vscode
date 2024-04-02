import React, { useState, useContext } from 'react'
import { VSCodeTextField, VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { usePostHog } from 'posthog-js/react'

import { API_BASE } from '../../data/constants'
import { vscode } from '../../lib/vscode-utils'
import { deserializeRepoKey, parseRepoInput } from '../../lib/greptile-utils'
import { SessionContext } from '../../providers/session-provider'
import type { Session } from '../../types/session'
import { RepositoryInfo } from '../../types/chat'
import { ChatStatus } from './chat-status'
import { RepoChip } from './chat-repo-chip'
import { RepoChipActions } from './chat-repo-chip-actions'

import '../../App.css'
import { ChatLoadingStateProvider } from '../../providers/chat-state-loading-provider'

export const NewChat = () => {
  const posthog = usePostHog()

  const { session, setSession } = useContext(SessionContext)
  const [isCloning, setIsCloning] = useState(false)

  const handleClone = async () => {
    setIsCloning(true)

    console.log('Parsing user input')
    const parsedRepo = await parseRepoInput(session)
    if (!parsedRepo) {
      console.log('Error: Invalid repository identifier')
      vscode.postMessage({
        command: 'error',
        text: 'Error: Invalid repository identifier',
      })
      setIsCloning(false)
      return
    }

    // console.log('Checking membership')
    const checkMembership = async () => {
      if (!session?.user) return

      const response = await fetch(`${API_BASE}/membership`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
        },
      }).then(async (res) => {
        return res.json()
      })

      if (response['membership'] !== session?.user?.membership) {
        setSession({
          ...session,
          user: {
            ...session?.user,
            token: session?.user?.tokens?.github.accessToken,
            membership: response['membership'],
          },
        } as Session)
      }
    }
    checkMembership()

    if (session?.user?.membership !== 'pro') {
      vscode.postMessage({
        command: 'info',
        text: `Upgrade to pro to use this extension!`,
      })
      setIsCloning(false)
      return
    }

    console.log('Handling clone')
    const submitJob = async () => {
      console.log('Submitting ', parsedRepo)

      const dRepoKey = deserializeRepoKey(parsedRepo)

      return fetch(`${API_BASE}/repositories`, {
        method: 'POST',
        body: JSON.stringify({
          remote: dRepoKey.remote,
          repository: dRepoKey.repository.toLowerCase() || '',
          branch: dRepoKey.branch.toLowerCase() || '',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
        },
      }).then(async (res) => {
        if (res.ok) {
          // console.log('yay');
          vscode.postMessage({
            command: 'info',
            text: `Repository submitted. If this is a new repository, we will email you at ${session?.user?.userId} once it has finished processing.`,
          })
          return res
        } else if (res.status === 404) {
          // && session?.user?.refreshToken) {
          console.log('Error: Needs refresh or unauthorized')
          vscode.postMessage({
            command: 'error',
            text: 'This repository/branch was not found, or you do not have access to it. If this is your repo, please try signing in again. Reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
          })
          setIsCloning(false)
          // todo: get refresh token
        } else {
          return res
        }
      })
    }

    if (parsedRepo) {
      // if session user token exists, set repoUrl to include token before github.com and after https:// with user session token + '@'
      await submitJob().then(async (res) => {
        if (res.ok) {
          posthog.capture('Repository submitted', {
            source: 'greptile-vscode',
            repo: parsedRepo || '',
          })
          if (!session?.state?.repos) {
            setSession({
              ...session,
              state: {
                ...session?.state,
                chat: undefined,
                messages: [],
                repos: [parsedRepo],
                repoStates: {
                  [parsedRepo]: {
                    status: 'submitted',
                    repository: parsedRepo,
                    branch: '',
                    remote: '',
                    numFiles: 1,
                    filesProcessed: 0,
                  },
                },
              },
            } as Session)
          } else {
            if (!session?.state?.repos.includes(parsedRepo)) {
              if (!session?.state?.chat) {
                setSession({
                  ...session,
                  state: {
                    ...session?.state,
                    messages: [],
                    repos: [...session?.state?.repos, parsedRepo],
                    repoStates: {
                      ...session?.state?.repoStates,
                      [parsedRepo]: {
                        status: 'submitted',
                        repository: parsedRepo,
                        branch: '',
                        remote: '',
                        numFiles: 1,
                        filesProcessed: 0,
                      },
                    },
                  },
                } as Session)
              } else {
                setSession({
                  ...session,
                  state: {
                    ...session?.state,
                    chat: {
                      ...session?.state?.chat,
                      repos: [...session?.state?.chat?.repos, parsedRepo],
                    },
                    messages: [],
                    repos: [...session?.state?.repos, parsedRepo],
                    repoStates: {
                      ...session?.state?.repoStates,
                      [parsedRepo]: {
                        status: 'submitted',
                        repository: parsedRepo,
                        branch: '',
                        remote: '',
                        numFiles: 1,
                        filesProcessed: 0,
                      },
                    },
                  },
                } as Session)
              }
            }
          }
        } else {
          if (res.status === 401) {
            const message = await res.json().then((data) => data.response)
            vscode.postMessage({
              command: 'error',
              text: `Permission error: ${message}`,
            })
            console.log('Permission error: ', message)
          } else if (res.status === 404) {
            vscode.postMessage({
              command: 'error',
              text: 'This repository/branch was not found, or you do not have access to it. If this is your repo, please try signing in again. Reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
            })
            console.log('Repository not found')
          } else {
            vscode.postMessage({
              command: 'error',
              text: `Unknown Error ${res.status} ${res.statusText}`,
            })
            console.log(`Unknown Error: ${res.status} ${res.statusText}`)
          }
        }
      })
    } else {
      console.log('Invalid GitHub URL')
      vscode.postMessage({
        command: 'error',
        text: 'Please enter a valid GitHub repository URL, like https://github.com/greptileai/greptile-vscode.',
      })
    }

    setIsCloning(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // && !session?.state?.error) {
      handleClone()
    }
  }

  const someValidRepos = () => {
    if (session?.state?.repoStates)
      Object.values(session.state.repoStates).some((repoState: RepositoryInfo) => {
        // console.log('repo state: ', repoState)
        return (
          (repoState.status !== 'completed' && repoState.sha) || repoState.status === 'completed'
        )
      })

    return false
  }

  return (
    <div>
      {session?.user ? (
        <div>
          <div>
            <p>Enter a Repo:</p>
            <div id='new-repo-container'>
              <VSCodeTextField
                placeholder=''
                value={session?.state?.repoUrl || ''}
                size={75}
                onKeyDown={handleKeyDown}
                onInput={(event) => {
                  setSession({
                    ...session,
                    state: {
                      ...session?.state,
                      repoUrl: event.currentTarget.value,
                    },
                  } as Session)
                }}
              >
                Github URL
              </VSCodeTextField>
              <div style={{
                "display": "flex",
                "alignItems": "end",
              }}>
              <VSCodeTextField
                id='new-repo-branch'
                placeholder='default'
                value={session?.state?.branch || ''}
                size={35}
                onKeyDown={handleKeyDown}
                onInput={(event) => {
                  setSession({
                    ...session,
                    state: {
                      ...session?.state,
                      branch: event.currentTarget.value,
                    },
                  } as Session)
                }}
              >
                Branch
              </VSCodeTextField>
              <VSCodeButton
                id='new-repo-submit'
                appearance='primary'
                aria-label='Add repo'
                onClick={handleClone}
                disabled={!!session?.state?.error}
              >
                {isCloning ? 'Loading...' : 'Add'}
              </VSCodeButton>
              </div>
            </div>
          </div>
          <div id='repo-chips'>
            {someValidRepos && session?.state?.repoStates ? (
              Object.keys(session?.state?.repoStates).map((repoKey) => (
                <>
                  <RepoChip key={repoKey} repoKey={repoKey}>
                    <RepoChipActions
                      deleteRepo={() => {
                        if (session?.state?.repos?.length === 1) {
                          vscode.postMessage({
                            command: 'info',
                            text: 'If you would like a clean reset, please use Greptile: Reset Session in the command palette.',
                          })
                        } else {
                          setSession({
                            ...session,
                            state: {
                              ...session?.state,
                              chat: {
                                ...session?.state?.chat,
                                repos: session?.state?.chat?.repos?.filter((r) => r !== repoKey),
                              },
                              repos: session?.state?.repos?.filter((r) => r !== repoKey),
                              repoStates: Object.keys(session?.state?.repoStates)
                                .filter((r) => r !== repoKey)
                                .reduce((newRepoStates, r) => {
                                  newRepoStates[r] = session?.state?.repoStates[r]
                                  return newRepoStates
                                }, {}),
                            },
                          } as Session)
                        }
                      }}
                    />
                  </RepoChip>
                  {session?.state?.repoStates[repoKey].status !== 'completed' && (
                    <ChatLoadingStateProvider>
                      <ChatStatus key={repoKey} repoKey={repoKey} />
                    </ChatLoadingStateProvider>
                  )}
                </>
              ))
            ) : (
              null
            )}
          </div>
        </div>
      ) : (
        <div id='sign-in-container'>
          <VSCodeButton
            onClick={() => {
              posthog.capture('Github Sign-in Clicked', { source: 'greptile-vscode' })
              vscode.postMessage({ command: 'signIn', text: 'github' })
            }}
          >
            {/* <div className='icon codicon codicon-github sign-in-icon'></div> */}
            Sign In
          </VSCodeButton>
        </div>
      )}
    </div>
  )
}
