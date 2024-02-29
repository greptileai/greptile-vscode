import React, { useState, useContext } from 'react'
import { VSCodeTextField, VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { usePostHog } from 'posthog-js/react'
import mixpanel from 'mixpanel-browser'

import { API_BASE } from '../../data/constants'
import { vscode } from '../../lib/vscode-utils'
import { deserializeRepoKey, parseRepoInput } from '../../lib/onboard-utils'
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

    console.log('Checking membership')
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
          return res
        } else if (res.status === 404) {
          // && session?.user?.refreshToken) {
          console.log('Error: Needs refresh token or unauthorized')
          vscode.postMessage({
            command: 'error',
            text: 'This repository was not found, or you do not have access to it. If this is your repo, please try logging in again. Reach out to us on Discord for support.',
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
      submitJob().then(async (res) => {
        if (res.ok) {
          posthog.capture('Repository cloned', {
            source: 'onboard-vscode',
            repo: parsedRepo || '',
          })
          mixpanel.track('Repository cloned', {
            source: 'onboard-vscode',
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
                  [parsedRepo]: undefined,
                },
              },
            } as Session)
          } else {
            if (!session?.state?.repos.includes(parsedRepo)) {
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
                    [parsedRepo]: undefined,
                  },
                },
              } as Session)
            }
          }

          vscode.postMessage({
            command: 'reload',
            text: '',
          })
        } else {
          if (res.status === 401) {
            const message = await res.json().then((data) => data.response)
            vscode.postMessage({
              command: 'error',
              text: `Permission error. ${message}`,
            })
            console.log('Permission error', message)
          } else if (res.status === 404) {
            vscode.postMessage({
              command: 'error',
              text: 'This repository/branch was not found, or you do not have access to it. If this is your repo, please try logging in again. Reach out to us on Discord for support.',
            })
            console.log('Repo not found')
          } else {
            vscode.postMessage({
              command: 'error',
              text: `Unknown Error ${res.status} ${res.statusText}`,
            })
            console.log('Unknown Error', res.status, res.statusText)
          }
          setIsCloning(false)
        }
      })
    } else {
      console.log('Invalid GitHub URL')
      vscode.postMessage({
        command: 'error',
        text: 'Please enter a valid GitHub repository URL, like https://github.com/onboardai/onboard.',
      })
      setIsCloning(false)
    }
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
      {session ? (
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
                  })
                }}
              >
                Github URL
              </VSCodeTextField>
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
                  })
                }}
              >
                Branch
              </VSCodeTextField>
              <VSCodeButton
                id='new-repo-submit'
                appearance='primary'
                aria-label='Submit repo'
                onClick={handleClone}
                disabled={!!session?.state?.error}
              >
                {isCloning ? 'Loading...' : 'Submit'}
              </VSCodeButton>
            </div>
          </div>
          <div id='repo-chips'>
            {someValidRepos && session?.state?.repoStates ? (
              Object.keys(session?.state?.repoStates).map((repoKey) => (
                // <ChatStatus key={} repoKey={} />
                <div>
                  <RepoChip key={repoKey} repoKey={repoKey}>
                    <RepoChipActions
                      deleteRepo={() => {
                        if (session?.state?.repos?.length === 1) {
                          console.log('')
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
                          })

                          vscode.postMessage({
                            command: 'reload',
                            text: '',
                          })
                        }
                      }}
                    />
                  </RepoChip>
                  <ChatLoadingStateProvider>
                    <ChatStatus key={repoKey} repoKey={repoKey} />
                  </ChatLoadingStateProvider>
                </div>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <div id='login-container'>
          <VSCodeButton
            onClick={() => {
              posthog.capture('Github Login Clicked', { source: 'onboard-vscode' })
              mixpanel.track('Github Login Clicked', { source: 'onboard-vscode' })
              vscode.postMessage({ command: 'login', text: 'github login' })
            }}
          >
            Login
          </VSCodeButton>
        </div>
      )}
    </div>
  )
}
